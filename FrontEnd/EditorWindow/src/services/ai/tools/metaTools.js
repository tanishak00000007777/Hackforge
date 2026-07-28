import { defineTool, ok, fail } from "./defineTool";
import { toolRegistry } from "../ToolRegistry";
import { searchToolIndex } from "../ToolRouter";

/**
 * The router only exposes a subset of tools per turn. These two keep every
 * capability reachable anyway: find a tool by describing it, then invoke it by
 * name -- so a narrower prompt never means a smaller editor.
 */

export const discoverTools = defineTool({
  name: "discoverTools",
  description: "Finds editor tools that are not in the current list. Describe what you want to do; returns matching tool names and their parameters, which you then run with callTool.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "What you are trying to do, e.g. 'change the heading colour on mobile'." },
      limit: { type: "number", description: "Maximum tools to return (default 8)." },
    },
    required: ["query"],
  },
  execute: ({ query, limit = 8 }) => {
    const matches = searchToolIndex(query, Math.min(limit, 20));
    if (!matches.length) {
      return ok({ query, matchCount: 0, tools: [], hint: "No tool matches. Say what is not possible rather than inventing one." });
    }
    return ok({ query, matchCount: matches.length, tools: matches, hint: "Run one of these with callTool." });
  },
});

export const callTool = defineTool({
  name: "callTool",
  description: "Runs any editor tool by name, including ones not listed in this turn. Use discoverTools first to learn the exact name and parameters.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Exact tool name from discoverTools." },
      args: { type: "object", description: "Parameters for that tool." },
    },
    required: ["name"],
  },
  execute: async ({ name, args }, context) => {
    if (name === "callTool") return fail("callTool cannot call itself.");

    const tool = toolRegistry.getTool(name);
    if (tool) {
      const result = await tool.execute(args || {}, context);
      return { ...result, tool: name };
    }

    // The name is invented. The argument names usually say what was actually
    // wanted ("fontFamily" -> updateTypography), so search on those too.
    const argNames = Object.keys(args || {});
    const matches = searchToolIndex(name, 5, argNames);
    const [best, runnerUp] = matches;

    if (!best) {
      return fail(
        `There is no tool for '${name}', and nothing similar exists. Tell the user this specific change is not supported yet, in plain language.`,
      );
    }

    // Auto-recover only when one tool clearly wins and the given arguments fit
    // it -- guessing wrong here would silently make the wrong edit.
    const decisive = best.score >= 8 && (!runnerUp || best.score >= runnerUp.score * 2);
    const required = best.parameters?.required || [];
    const known = new Set(Object.keys(best.parameters?.properties || {}));
    const argsFit =
      required.every((key) => args?.[key] !== undefined) &&
      argNames.some((key) => known.has(key));

    if (decisive && argsFit) {
      const result = await toolRegistry.getTool(best.name).execute(args, context);
      return { ...result, tool: best.name, recoveredFrom: name };
    }

    return fail(
      `'${name}' is not a tool. The closest match is ${best.name} (${best.description}). ` +
        `Call it via callTool with these parameters: ${JSON.stringify(best.parameters?.properties || {}).slice(0, 300)}. ` +
        (matches.length > 1 ? `Other options: ${matches.slice(1).map((m) => m.name).join(", ")}.` : ""),
    );
  },
});

export const metaTools = [discoverTools, callTool];
