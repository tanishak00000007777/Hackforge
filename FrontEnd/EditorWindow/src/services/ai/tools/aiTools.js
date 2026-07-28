import { defineTool, ok, fail, resolveTarget, summarizeNode } from "./defineTool";
import { toolRegistry } from "../ToolRegistry";
import { aiProvider } from "../providers/AIProvider";
import { resolveNodeRef } from "@/builder/commands/treeHelpers";
import { componentRegistry } from "@/builder/registry";
import { catalogueMetadata } from "@/builder/registry/catalogue";
import { collectLayout, collectHierarchy, collectAccessibility, collectSeo } from "./analysisTools";

const SPACING_GRID = 8;

/**
 * Composites propose concrete tool calls rather than prose, so the same
 * actions can be reviewed, validated (validateChanges) or run (apply: true).
 * A finding with no tool that can fix it is reported as manual work instead of
 * being silently dropped.
 */
async function runActions(actions, context) {
  const results = [];
  for (const [index, action] of actions.entries()) {
    const tool = toolRegistry.getTool(action.tool);
    if (!tool) {
      results.push({ index, tool: action.tool, success: false, error: `Unknown tool '${action.tool}'.` });
      continue;
    }
    const result = await tool.execute(action.args, context);
    results.push({ index, tool: action.tool, ...result });
  }
  return results;
}

const composite = ({ name, description, plan }) =>
  defineTool({
    name,
    description,
    parameters: {
      type: "object",
      properties: {
        rootId: { type: "string", description: "Limit to this subtree. Omit for the whole page." },
        apply: { type: "boolean", description: "Execute the recommended actions (default false: propose only)." },
      },
    },
    execute: async ({ rootId, apply = false }, context) => {
      const all = context.getState().components;
      const scope = rootId ? [resolveNodeRef(all, rootId)].filter(Boolean) : all;
      if (rootId && !scope.length) return fail(`No node found with id '${rootId}'.`);

      const { actions, manual, summary } = plan(scope);
      const executed = apply && actions.length ? await runActions(actions, context) : [];

      return ok({
        scope: rootId || "page",
        summary,
        recommendedActions: actions,
        manualFindings: manual,
        applied: apply,
        results: executed,
        succeeded: executed.filter((r) => r.success).length,
        undoSteps: executed.filter((r) => r.success).length,
      });
    },
  });

/** Findings we cannot fix with the available tools, kept visible. */
const asManual = (findings) =>
  findings.map((f) => ({ severity: f.severity, category: f.category, message: f.message, componentId: f.componentId, suggestedFix: f.fix }));

function walk(components, visit) {
  const step = (node) => {
    visit(node);
    for (const child of node.children || []) step(child);
  };
  components.forEach(step);
}

/* ============================================================ */

export const improveDesign = composite({
  name: "improveDesign",
  description: "Reviews spacing, hierarchy and layout, then proposes concrete fixes. Set apply to true to make them.",
  plan: (scope) => {
    const actions = [];
    const { findings } = collectLayout(scope);

    walk(scope, (node) => {
      const spacing = {};
      for (const [prop, value] of Object.entries(node.styles || {})) {
        if (!/^(padding|margin|gap)/.test(prop)) continue;
        const pixels = parseInt(value, 10);
        if (Number.isNaN(pixels) || pixels % SPACING_GRID === 0) continue;
        spacing[prop] = Math.round(pixels / SPACING_GRID) * SPACING_GRID;
      }
      if (Object.keys(spacing).length) {
        actions.push({ tool: "updateSpacing", args: { componentId: node.id, ...spacing }, reason: `Snap ${node.type} spacing to the ${SPACING_GRID}px grid.` });
      }
    });

    const unfixable = findings.filter((f) => f.category !== "spacing");
    return {
      actions,
      manual: asManual(unfixable),
      summary: `${actions.length} spacing fix(es) available; ${unfixable.length} finding(s) need a judgement call.`,
    };
  },
});

export const modernizeLayout = composite({
  name: "modernizeLayout",
  description: "Applies a contemporary look: generous section padding, softer corners and consistent card treatment.",
  plan: (scope) => {
    const actions = [];

    for (const section of scope) {
      if (!componentRegistry[section.type]) continue;
      const padding = parseInt(section.styles?.paddingTop, 10);
      if (Number.isNaN(padding) || padding < 64) {
        actions.push({ tool: "applyStylePreset", args: { componentId: section.id, preset: "section-airy" }, reason: `Give the ${section.type} section modern breathing room.` });
      }
    }

    walk(scope, (node) => {
      if (node.type !== "card") return;
      const radius = parseInt(node.styles?.borderRadius, 10);
      if (Number.isNaN(radius) || radius < 12) {
        actions.push({ tool: "applyStylePreset", args: { componentId: node.id, preset: "card-soft" }, reason: "Soften the card with rounded corners and a subtle shadow." });
      }
    });

    return { actions, manual: [], summary: `${actions.length} modernization step(s) proposed.` };
  },
});

export const optimizeUX = composite({
  name: "optimizeUX",
  description: "Checks the page works as a funnel: a clear call to action, no dead containers, readable body text.",
  plan: (scope) => {
    const actions = [];
    const manual = [];
    let buttons = 0;
    let emptyContainers = 0;

    walk(scope, (node) => {
      if (node.type === "button") buttons++;
      if (["container", "row", "column", "grid"].includes(node.type) && !(node.children || []).length) {
        emptyContainers++;
        actions.push({ tool: "deleteElement", args: { elementId: node.id }, reason: `Remove the empty ${node.type}, which renders nothing.` });
      }
      const size = parseInt(node.styles?.fontSize, 10);
      if (node.type === "paragraph" && !Number.isNaN(size) && size < 14) {
        actions.push({ tool: "updateTypography", args: { componentId: node.id, fontSize: 16 }, reason: "Raise body text to a comfortable reading size." });
      }
    });

    if (buttons === 0) {
      manual.push({ severity: "high", category: "ux", message: "The page has no button, so there is no call to action.", componentId: null, suggestedFix: "createElement a button in the hero section." });
    }

    return { actions, manual, summary: `${buttons} call(s) to action, ${emptyContainers} empty container(s); ${actions.length} fix(es) proposed.` };
  },
});

export const optimizeAccessibility = composite({
  name: "optimizeAccessibility",
  description: "Finds accessibility problems and fixes the ones that can be fixed mechanically, such as unreadable font sizes.",
  plan: (scope) => {
    const actions = [];
    const { findings } = collectAccessibility(scope);

    walk(scope, (node) => {
      const size = parseInt(node.styles?.fontSize, 10);
      if (!Number.isNaN(size) && size < 12) {
        actions.push({ tool: "updateTypography", args: { componentId: node.id, fontSize: 14 }, reason: `Raise ${size}px text to the 14px readability floor.` });
      }
    });

    // Alt text and button labels need real words: a person or a content tool.
    const manual = findings.filter((f) => !f.message.includes("readability floor"));
    return {
      actions,
      manual: asManual(manual),
      summary: `${actions.length} automatic fix(es); ${manual.length} need wording (use rewriteContent or replaceImage with alt).`,
    };
  },
});

export const optimizeSEO = composite({
  name: "optimizeSEO",
  description: "Reviews the heading outline, content depth and alt-text coverage, and reports what to change.",
  plan: (scope) => {
    const { findings, metrics } = collectSeo(scope);
    const { findings: hierarchyFindings } = collectHierarchy(scope);
    const all = [...findings, ...hierarchyFindings];

    // Every SEO fix is a content or structure decision, never a style write.
    return {
      actions: [],
      manual: asManual(all),
      summary: `${metrics.words} words, ${metrics.h1Count} H1, ${metrics.missingAlt} image(s) without alt. ${all.length} issue(s) to address.`,
    };
  },
});

/* --- explanation tools: language model over structured findings --- */

async function explain(system, payload) {
  try {
    const result = await aiProvider.sendPrompt(system, [{ role: "user", content: JSON.stringify(payload) }], []);
    const text = (result?.message || "").trim();
    return text ? { text } : { error: "The language model returned nothing." };
  } catch (err) {
    return { error: `The language model call failed: ${err.message}` };
  }
}

export const explainDesignDecision = defineTool({
  name: "explainDesignDecision",
  description: "Explains why a component is styled the way it is, and what the trade-offs are, based on its real styles and context.",
  parameters: {
    type: "object",
    properties: {
      componentId: { type: "string", description: "Component to explain. Defaults to the current selection." },
      question: { type: "string", description: "Optional specific question, e.g. 'why is this hard to read?'." },
    },
  },
  execute: async ({ componentId, question }, context) => {
    const { node, error } = resolveTarget(context, componentId);
    if (error) return fail(error);

    const state = context.getState();
    const { text, error: llmError } = await explain(
      "You are a senior product designer. Given a component's real styles and page context, explain the design " +
      "decisions in 2-4 sentences: what the styling achieves, and any trade-off worth knowing. Be concrete and " +
      "reference actual values. No markdown headings, no bullet lists.",
      {
        question: question || "Why is this component designed this way?",
        component: summarizeNode(node, 1),
        responsive: node.responsive || {},
        themeMode: state.globalTheme?.mode,
        catalogue: catalogueMetadata[node.type] || null,
      },
    );
    if (llmError) return fail(llmError);

    return ok({ componentId: node.id, type: node.type, question: question || null, explanation: text });
  },
});

export const suggestAlternatives = defineTool({
  name: "suggestAlternatives",
  description: "Proposes different design directions for a component, each as a concrete tool call that can be applied.",
  parameters: {
    type: "object",
    properties: {
      componentId: { type: "string", description: "Component to suggest alternatives for. Defaults to the current selection." },
      count: { type: "number", description: "How many directions to propose (default 3)." },
    },
  },
  execute: async ({ componentId, count = 3 }, context) => {
    const { node, error } = resolveTarget(context, componentId);
    if (error) return fail(error);

    const presetTool = toolRegistry.getTool("applyStylePreset");
    const presets = presetTool?.parameters?.properties?.preset?.enum || [];

    const { text, error: llmError } = await explain(
      `You are a senior product designer. Propose ${count} distinct design directions for this component. ` +
      `Reply as a JSON array of objects: {"name": short label, "rationale": one sentence, "preset": one of ` +
      `[${presets.join(", ")}] or null}. Return ONLY the JSON array.`,
      { component: summarizeNode(node, 1), availablePresets: presets },
    );
    if (llmError) return fail(llmError);

    let suggestions;
    try {
      suggestions = JSON.parse(text.replace(/^```(?:json)?|```$/g, "").trim());
    } catch {
      return fail(`The model did not return valid JSON: ${text.slice(0, 200)}`);
    }
    if (!Array.isArray(suggestions)) return fail("Expected a JSON array of suggestions.");

    return ok({
      componentId: node.id,
      type: node.type,
      suggestions: suggestions.map((entry) => ({
        name: entry.name,
        rationale: entry.rationale,
        action: presets.includes(entry.preset)
          ? { tool: "applyStylePreset", args: { componentId: node.id, preset: entry.preset } }
          : null,
      })),
    });
  },
});

export const aiTools = [
  improveDesign, modernizeLayout, optimizeUX, optimizeAccessibility,
  optimizeSEO, explainDesignDecision, suggestAlternatives,
];
