import { defineTool, ok, fail } from "./defineTool";
import { toolRegistry } from "../ToolRegistry";
import { editorAdapter } from "../EditorAdapter";
import { componentRegistry, elementRegistry } from "@/builder/registry";
import { catalogueMetadata } from "@/builder/registry/catalogue";
import { resolveNodeRef } from "@/builder/commands/treeHelpers";

const SECTION_TYPES = Object.keys(componentRegistry);
const ELEMENT_TYPES = Object.keys(elementRegistry);
const ALL_TYPES = [...SECTION_TYPES, ...ELEMENT_TYPES];

const describeType = (type) => {
  const meta = catalogueMetadata[type] || {};
  return {
    type,
    kind: SECTION_TYPES.includes(type) ? "section" : "element",
    category: meta.category || "Other",
    description: meta.description || "",
    tags: meta.tags || [],
  };
};

export const getAvailableComponents = defineTool({
  name: "getAvailableComponents",
  description: "Lists every section and element type that can be created, with categories and tags.",
  parameters: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["section", "element", "all"], description: "Filter by kind (default all)." },
      category: { type: "string", description: "Filter by catalogue category, e.g. 'Layout', 'Typography'." },
    },
  },
  execute: ({ kind = "all", category }) => {
    let types = ALL_TYPES.map(describeType);
    if (kind !== "all") types = types.filter((entry) => entry.kind === kind);
    if (category) types = types.filter((entry) => entry.category.toLowerCase() === category.toLowerCase());

    return ok({
      count: types.length,
      categories: [...new Set(types.map((entry) => entry.category))],
      components: types,
    });
  },
});

export const searchComponents = defineTool({
  name: "searchComponents",
  description: "Searches the component catalogue by keyword. Use this to find which type to create; use findComponent to search what is already on the canvas.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Keyword, e.g. 'pricing', 'video', 'cta'." },
      limit: { type: "number", description: "Maximum results (default 10)." },
    },
    required: ["query"],
  },
  execute: ({ query, limit = 10 }) => {
    const needle = String(query).toLowerCase().trim();
    if (!needle) return fail("query cannot be empty.");

    // Exact type beats a tag hit beats a substring in the type or description.
    const scored = ALL_TYPES.map((type) => {
      const entry = describeType(type);
      let score = 0;
      if (type === needle) score = 100;
      else if (entry.tags.includes(needle)) score = 60;
      else if (type.includes(needle)) score = 40;
      else if (entry.tags.some((tag) => tag.includes(needle))) score = 25;
      else if (entry.description.toLowerCase().includes(needle)) score = 15;
      return { ...entry, score };
    }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score);

    return ok({ query: needle, matchCount: scored.length, matches: scored.slice(0, limit) });
  },
});

export const validateChanges = defineTool({
  name: "validateChanges",
  description: "Dry-runs a list of tool calls: checks the tools exist, required parameters are present and referenced ids resolve. Changes nothing.",
  parameters: {
    type: "object",
    properties: {
      actions: {
        type: "array",
        description: "Actions to validate, each { tool: string, args: object }.",
        items: { type: "object" },
      },
    },
    required: ["actions"],
  },
  execute: ({ actions }, context) => {
    if (!Array.isArray(actions) || !actions.length) return fail("actions must be a non-empty array.");

    const components = context.getState().components;
    const ID_KEYS = ["componentId", "sectionId", "elementId", "targetId", "groupId", "rootId"];
    const results = actions.map((action, index) => {
      const problems = [];
      const tool = toolRegistry.getTool(action?.tool);

      if (!tool) {
        problems.push(`Unknown tool '${action?.tool}'.`);
      } else {
        for (const key of tool.parameters?.required || []) {
          if (action.args?.[key] === undefined || action.args[key] === null) problems.push(`Missing required parameter '${key}'.`);
        }
      }

      for (const key of ID_KEYS) {
        const id = action?.args?.[key];
        if (id && !resolveNodeRef(components, id)) problems.push(`${key} '${id}' does not exist on the canvas.`);
      }
      for (const id of action?.args?.elementIds || action?.args?.sectionIds || []) {
        if (!resolveNodeRef(components, id)) problems.push(`id '${id}' does not exist on the canvas.`);
      }

      return { index, tool: action?.tool, valid: problems.length === 0, problems };
    });

    return ok({ valid: results.every((r) => r.valid), checked: results.length, results });
  },
});

export const executeBatchActions = defineTool({
  name: "executeBatchActions",
  description: "Runs several tool calls in order. Stops at the first failure unless continueOnError is set. Use rollbackChanges to undo.",
  parameters: {
    type: "object",
    properties: {
      actions: {
        type: "array",
        description: "Actions to run, each { tool: string, args: object }.",
        items: { type: "object" },
      },
      continueOnError: { type: "boolean", description: "Keep going after a failed action (default false)." },
    },
    required: ["actions"],
  },
  execute: async ({ actions, continueOnError = false }, context) => {
    if (!Array.isArray(actions) || !actions.length) return fail("actions must be a non-empty array.");

    const historyBefore = context.getState().history.length;
    const results = [];

    for (const [index, action] of actions.entries()) {
      const tool = toolRegistry.getTool(action?.tool);
      if (!tool) {
        results.push({ index, tool: action?.tool, success: false, error: `Unknown tool '${action?.tool}'.` });
        if (!continueOnError) break;
        continue;
      }

      // Tools already return the envelope; no need to re-wrap.
      const result = await tool.execute(action.args || {}, context);
      results.push({ index, tool: action.tool, ...result });
      if (!result.success && !continueOnError) break;
    }

    const succeeded = results.filter((r) => r.success).length;
    return ok({
      requested: actions.length,
      executed: results.length,
      succeeded,
      failed: results.length - succeeded,
      completed: succeeded === actions.length,
      undoSteps: context.getState().history.length - historyBefore,
      results,
    });
  },
});

export const rollbackChanges = defineTool({
  name: "rollbackChanges",
  description: "Undoes recent changes. Pass the undoSteps returned by executeBatchActions to revert a whole batch.",
  parameters: {
    type: "object",
    properties: { steps: { type: "number", description: "How many changes to undo (default 1)." } },
  },
  execute: ({ steps = 1 }, context) => {
    const requested = Math.max(1, Math.floor(Number(steps) || 1));
    const available = context.getState().history.length;
    if (available === 0) return fail("Nothing to undo.");

    const applied = Math.min(requested, available);
    for (let i = 0; i < applied; i++) editorAdapter.undo();

    return ok({
      requested,
      undone: applied,
      shortfall: requested - applied,
      historyDepth: context.getState().history.length,
    });
  },
});

export const utilityTools = [
  getAvailableComponents, searchComponents, validateChanges, executeBatchActions, rollbackChanges,
];
