/**
 * One shape for every AI tool, so an LLM can call any of them the same way.
 *
 *   success: { success: true, data: {...} }
 *   failure: { success: false, error: "why" }
 *
 * `success` is kept (rather than a new `ok` flag) because ToolExecutor and the
 * four original tools already speak it.
 */

export const ok = (data = {}) => ({ success: true, data });
export const fail = (error) => ({ success: false, error: String(error) });

export function defineTool({ name, description, parameters, execute }) {
  if (!name || !description || typeof execute !== "function") {
    throw new Error(`Invalid tool definition: ${name || "(unnamed)"}`);
  }

  const schema = parameters || { type: "object", properties: {} };

  return {
    name,
    description,
    parameters: schema,

    async execute(args = {}, context) {
      const missing = (schema.required || []).filter((key) => args?.[key] === undefined || args[key] === null);
      if (missing.length) {
        return fail(`Missing required parameter(s): ${missing.join(", ")}`);
      }

      try {
        const result = await execute(args || {}, context);
        // A tool that forgets to wrap its return still yields valid JSON.
        if (result && typeof result === "object" && "success" in result) return result;
        return ok(result ?? {});
      } catch (err) {
        return fail(err?.message || err);
      }
    },
  };
}

/* --- shared helpers, so tools stay one-responsibility --- */

/** Resolve target node from an explicit id or the current selection. */
export function resolveTarget(context, id) {
  const node = context.resolveNode(id);
  if (!node) {
    return { error: id ? `No node found with id '${id}'.` : "No component specified and nothing is selected." };
  }
  return { node };
}

/** Trim a node for returning to the model: no giant nested subtrees. */
export function summarizeNode(node, depth = 1) {
  if (!node) return null;
  return {
    id: node.id,
    type: node.type,
    props: node.props || {},
    styles: node.styles || {},
    hidden: !!node.hidden,
    locked: !!node.locked,
    childCount: node.children?.length || 0,
    children: depth > 0 ? (node.children || []).map((child) => summarizeNode(child, depth - 1)) : undefined,
  };
}
