import { defineTool, ok, fail, resolveTarget, summarizeNode } from "./defineTool";
import { editorAdapter } from "../EditorAdapter";
import * as coreFactory from "@/builder/factories/coreFactory";
import { elementRegistry } from "@/builder/registry";
import { resolveNodeRef, findParentOf } from "@/builder/commands/treeHelpers";

const ELEMENT_TYPES = Object.keys(elementRegistry);
const POSITIONS = ["before", "after", "inside"];

const elementIdParam = { type: "string", description: "Id of the element. Defaults to the current selection." };

function buildElement(type) {
  if (!ELEMENT_TYPES.includes(type)) {
    return { error: `Unknown element type '${type}'. Available: ${ELEMENT_TYPES.join(", ")}.` };
  }
  const node = coreFactory.createElement(type);
  if (!node) return { error: `Factory could not build a '${type}' element.` };
  return { node };
}

export const createElement = defineTool({
  name: "createElement",
  description:
    "Creates an element and places it relative to an existing node (inside a container, or before/after a " +
    "sibling). For bullet points use type 'list' with props.items as an array of strings -- one list element, " +
    "not one element per bullet.",
  parameters: {
    type: "object",
    properties: {
      type: { type: "string", enum: ELEMENT_TYPES, description: `Element type: ${ELEMENT_TYPES.join(", ")}.` },
      targetId: { type: "string", description: "Node to place it against. Defaults to the current selection; omit both to append to the page." },
      position: { type: "string", enum: POSITIONS, description: "inside | before | after (default inside)." },
      props: { type: "object", description: "Initial props, e.g. { text: 'Sign up' }." },
    },
    required: ["type"],
  },
  execute: ({ type, targetId, position = "inside", props }, context) => {
    const { node, error } = buildElement(type);
    if (error) return fail(error);
    if (!POSITIONS.includes(position)) return fail(`position must be one of: ${POSITIONS.join(", ")}.`);
    if (props) node.props = { ...node.props, ...props };

    const anchor = targetId ? resolveNodeRef(context.getState().components, targetId) : context.getSelectedNode();
    if (targetId && !anchor) return fail(`No node found with id '${targetId}'.`);

    if (anchor) editorAdapter.insertNode(node, anchor.id, position);
    else editorAdapter.addComponent(node);

    return ok({ element: summarizeNode(node, 0), placedAt: anchor ? { targetId: anchor.id, position } : "page-root" });
  },
});

export const deleteElement = defineTool({
  name: "deleteElement",
  description: "Removes an element from anywhere in the tree, along with its children.",
  parameters: { type: "object", properties: { elementId: elementIdParam } },
  execute: ({ elementId }, context) => {
    const { node, error } = resolveTarget(context, elementId);
    if (error) return fail(error);
    editorAdapter.deleteNode(node.id);
    return ok({ deleted: summarizeNode(node, 0) });
  },
});

export const duplicateElement = defineTool({
  name: "duplicateElement",
  description: "Copies an element, with fresh ids, and inserts the copy right after the original.",
  parameters: { type: "object", properties: { elementId: elementIdParam } },
  execute: ({ elementId }, context) => {
    const { node, error } = resolveTarget(context, elementId);
    if (error) return fail(error);

    const copy = coreFactory.duplicateNode(node);
    editorAdapter.insertNode(copy, node.id, "after");
    return ok({ sourceId: node.id, duplicateId: copy.id });
  },
});

export const moveElement = defineTool({
  name: "moveElement",
  description: "Moves an element next to or inside another node.",
  parameters: {
    type: "object",
    properties: {
      elementId: { type: "string", description: "Element to move." },
      targetId: { type: "string", description: "Node to move it relative to." },
      position: { type: "string", enum: POSITIONS, description: "inside | before | after (default after)." },
    },
    required: ["elementId", "targetId"],
  },
  execute: ({ elementId, targetId, position = "after" }, context) => {
    const components = context.getState().components;
    if (!resolveNodeRef(components, elementId)) return fail(`No node found with id '${elementId}'.`);
    if (!resolveNodeRef(components, targetId)) return fail(`No node found with id '${targetId}'.`);
    if (elementId === targetId) return fail("An element cannot be moved relative to itself.");
    if (!POSITIONS.includes(position)) return fail(`position must be one of: ${POSITIONS.join(", ")}.`);
    if (resolveNodeRef([resolveNodeRef(components, elementId)], targetId) && elementId !== targetId) {
      return fail("Cannot move an element inside its own subtree.");
    }

    editorAdapter.moveNode(elementId, targetId, position);
    return ok({ elementId, targetId, position });
  },
});

export const wrapElement = defineTool({
  name: "wrapElement",
  description: "Wraps an element in a new container-style element, keeping it in place.",
  parameters: {
    type: "object",
    properties: {
      elementId: elementIdParam,
      wrapperType: { type: "string", enum: ELEMENT_TYPES, description: "Wrapper type, e.g. 'container', 'row', 'column', 'card'." },
    },
    required: ["wrapperType"],
  },
  execute: ({ elementId, wrapperType }, context) => {
    const { node, error } = resolveTarget(context, elementId);
    if (error) return fail(error);
    const { node: wrapper, error: buildError } = buildElement(wrapperType);
    if (buildError) return fail(buildError);

    editorAdapter.wrapNode(node.id, wrapper);
    return ok({ wrappedId: node.id, wrapperId: wrapper.id, wrapperType });
  },
});

export const unwrapElement = defineTool({
  name: "unwrapElement",
  description: "Removes a container but keeps its children, splicing them into its position.",
  parameters: { type: "object", properties: { elementId: elementIdParam } },
  execute: ({ elementId }, context) => {
    const { node, error } = resolveTarget(context, elementId);
    if (error) return fail(error);
    if (!node.children?.length) return fail(`Element '${node.id}' has no children to keep; use deleteElement instead.`);

    editorAdapter.unwrapNode(node.id);
    return ok({ removedId: node.id, promotedChildren: node.children.map((child) => child.id) });
  },
});

export const groupElements = defineTool({
  name: "groupElements",
  description: "Collects sibling elements into one new container, placed where the first element sat.",
  parameters: {
    type: "object",
    properties: {
      elementIds: { type: "array", items: { type: "string" }, description: "Two or more sibling element ids." },
      wrapperType: { type: "string", enum: ELEMENT_TYPES, description: "Container type (default 'container')." },
    },
    required: ["elementIds"],
  },
  execute: ({ elementIds, wrapperType = "container" }, context) => {
    if (!Array.isArray(elementIds) || elementIds.length < 2) return fail("Provide at least two element ids.");

    const components = context.getState().components;
    const missing = elementIds.filter((id) => !resolveNodeRef(components, id));
    if (missing.length) return fail(`No node found with id(s): ${missing.join(", ")}.`);

    // Grouping across different parents would silently restructure the page.
    const parents = elementIds.map((id) => findParentOf(components, id)?.id ?? "__root__");
    if (new Set(parents).size > 1) return fail("Elements must share the same parent to be grouped.");

    const { node: wrapper, error } = buildElement(wrapperType);
    if (error) return fail(error);

    editorAdapter.groupNodes(elementIds, wrapper);
    return ok({ groupId: wrapper.id, wrapperType, groupedIds: elementIds });
  },
});

export const ungroupElements = defineTool({
  name: "ungroupElements",
  description: "Dissolves a group container, leaving its children in its place. Inverse of groupElements.",
  parameters: { type: "object", properties: { groupId: { type: "string", description: "Id of the group container." } } },
  execute: ({ groupId }, context) => {
    const { node, error } = resolveTarget(context, groupId);
    if (error) return fail(error);
    if (!node.children?.length) return fail(`Node '${node.id}' has no children, so there is nothing to ungroup.`);

    editorAdapter.unwrapNode(node.id);
    return ok({ ungroupedId: node.id, promotedChildren: node.children.map((child) => child.id) });
  },
});

export const changeElementType = defineTool({
  name: "changeElementType",
  description: "Converts an element to another type, carrying over its props, styles and children where they still apply.",
  parameters: {
    type: "object",
    properties: {
      elementId: elementIdParam,
      newType: { type: "string", enum: ELEMENT_TYPES, description: "Target element type." },
    },
    required: ["newType"],
  },
  execute: ({ elementId, newType }, context) => {
    const { node, error } = resolveTarget(context, elementId);
    if (error) return fail(error);
    if (node.type === newType) return fail(`Element '${node.id}' is already a '${newType}'.`);

    const { node: blank, error: buildError } = buildElement(newType);
    if (buildError) return fail(buildError);

    editorAdapter.changeNodeType(node.id, blank);
    return ok({ elementId: node.id, from: node.type, to: newType });
  },
});

export const elementTools = [
  createElement, deleteElement, duplicateElement, moveElement, wrapElement,
  unwrapElement, groupElements, ungroupElements, changeElementType,
];
