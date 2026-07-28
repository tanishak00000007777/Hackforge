import { defineTool, ok, fail, resolveTarget, summarizeNode } from "./defineTool";
import { editorAdapter } from "../EditorAdapter";
import { resolveNodeRef, findNodePath } from "@/builder/commands/treeHelpers";
import { catalogueMetadata } from "@/builder/registry/catalogue";

const idParam = (description) => ({ type: "string", description });

export const getSelection = defineTool({
  name: "getSelection",
  description: "Returns the ids and summaries of the currently selected components.",
  execute: (_args, context) => {
    const state = context.getState();
    return ok({
      selectedIds: state.selectedIds,
      nodes: state.selectedIds.map((id) => summarizeNode(resolveNodeRef(state.components, id), 0)).filter(Boolean),
    });
  },
});

export const selectComponent = defineTool({
  name: "selectComponent",
  description: "Selects a component by id, so later tools can act on it without an explicit id.",
  parameters: {
    type: "object",
    properties: {
      componentId: idParam("Id of the component to select."),
      additive: { type: "boolean", description: "Add to the current selection instead of replacing it." },
    },
    required: ["componentId"],
  },
  execute: ({ componentId, additive }, context) => {
    if (!resolveNodeRef(context.getState().components, componentId)) {
      return fail(`No node found with id '${componentId}'.`);
    }
    if (additive) editorAdapter.toggleSelection(componentId);
    else editorAdapter.select(componentId);
    return ok({ selectedIds: context.getState().selectedIds });
  },
});

export const findComponent = defineTool({
  name: "findComponent",
  description: "Finds components by type and/or text content. Use this to turn a description like 'the hero heading' into an id.",
  parameters: {
    type: "object",
    properties: {
      type: { type: "string", description: "Component type to match, e.g. 'heading', 'hero'." },
      text: { type: "string", description: "Case-insensitive substring to match against the component's text props." },
      limit: { type: "number", description: "Maximum matches to return (default 10)." },
    },
  },
  execute: ({ type, text, limit = 10 }, context) => {
    const needle = text?.toLowerCase();
    const matches = [];

    const walk = (nodes, depth = 0) => {
      for (const node of nodes || []) {
        const typeHit = !type || node.type === type;
        const haystack = Object.values(node.props || {})
          .filter((value) => typeof value === "string")
          .join(" ")
          .toLowerCase();
        const textHit = !needle || haystack.includes(needle);

        if (typeHit && textHit && (type || needle)) {
          matches.push({ ...summarizeNode(node, 0), depth });
        }
        walk(node.children, depth + 1);
      }
    };

    walk(context.getState().components);
    return ok({ matchCount: matches.length, matches: matches.slice(0, limit) });
  },
});

export const getComponentTree = defineTool({
  name: "getComponentTree",
  description: "Returns the page structure as a nested id/type tree. Use it to understand layout before editing.",
  parameters: {
    type: "object",
    properties: {
      rootId: idParam("Optional subtree root. Omit for the whole page."),
      maxDepth: { type: "number", description: "How deep to descend (default 4)." },
    },
  },
  execute: ({ rootId, maxDepth = 4 }, context) => {
    const components = context.getState().components;

    const shape = (node, depth) => ({
      id: node.id,
      type: node.type,
      hidden: !!node.hidden,
      children: depth <= 0 ? undefined : (node.children || []).map((child) => shape(child, depth - 1)),
    });

    if (rootId) {
      const root = resolveNodeRef(components, rootId);
      if (!root) return fail(`No node found with id '${rootId}'.`);
      return ok({ tree: [shape(root, maxDepth)] });
    }
    return ok({ tree: components.map((node) => shape(node, maxDepth)) });
  },
});

export const inspectComponent = defineTool({
  name: "inspectComponent",
  description: "Returns everything about one component: props, styles, responsive overrides, ancestry and catalogue metadata.",
  parameters: {
    type: "object",
    properties: { componentId: idParam("Id to inspect. Defaults to the current selection.") },
  },
  execute: ({ componentId }, context) => {
    const { node, error } = resolveTarget(context, componentId);
    if (error) return fail(error);

    const meta = catalogueMetadata[node.type];
    return ok({
      ...summarizeNode(node, 1),
      responsive: node.responsive || {},
      path: findNodePath(context.getState().components, node.id),
      catalogue: meta ? { category: meta.category, description: meta.description, tags: meta.tags } : null,
    });
  },
});

export const selectionTools = [getSelection, selectComponent, findComponent, getComponentTree, inspectComponent];
