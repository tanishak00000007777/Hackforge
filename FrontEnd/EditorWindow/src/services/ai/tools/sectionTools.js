import { defineTool, ok, fail, summarizeNode } from "./defineTool";
import { editorAdapter } from "../EditorAdapter";
import * as coreFactory from "@/builder/factories/coreFactory";
import { componentRegistry } from "@/builder/registry";
import { resolveNodeRef } from "@/builder/commands/treeHelpers";

const SECTION_TYPES = Object.keys(componentRegistry);

const sectionIdParam = { type: "string", description: "Id of the section." };

/** Sections are the root-level nodes; elements are not. */
function getSection(context, sectionId) {
  const section = context.getState().components.find((node) => node.id === sectionId);
  if (!section) {
    return { error: resolveNodeRef(context.getState().components, sectionId)
      ? `Node '${sectionId}' is an element, not a top-level section.`
      : `No section found with id '${sectionId}'.` };
  }
  return { section };
}

function buildSection(type) {
  if (!SECTION_TYPES.includes(type)) {
    return { error: `Unknown section type '${type}'. Available: ${SECTION_TYPES.join(", ")}.` };
  }
  const node = coreFactory.createComponent(type);
  if (!node) return { error: `Factory could not build a '${type}' section.` };
  return { node };
}

export const createSection = defineTool({
  name: "createSection",
  description:
    "Adds a new section to the page. Sections are the top-level building blocks. Use 'blank' for a new empty " +
    "section to fill with your own content; the other types come pre-filled with hackathon layouts.",
  parameters: {
    type: "object",
    properties: {
      type: { type: "string", enum: SECTION_TYPES, description: `Section type. Use 'blank' unless a pre-built layout is wanted. One of: ${SECTION_TYPES.join(", ")}.` },
      index: { type: "number", description: "Position to insert at. Omit to append to the end." },
    },
    required: ["type"],
  },
  execute: ({ type, index }, context) => {
    const { node, error } = buildSection(type);
    if (error) return fail(error);

    editorAdapter.addComponent(node);
    if (index !== undefined) {
      const appendedAt = context.getState().components.length - 1;
      editorAdapter.moveComponent(appendedAt, index);
    }
    return ok({ section: summarizeNode(node, 0), index: context.getState().components.findIndex((n) => n.id === node.id) });
  },
});

export const deleteSection = defineTool({
  name: "deleteSection",
  description: "Removes a section and everything inside it.",
  parameters: { type: "object", properties: { sectionId: sectionIdParam }, required: ["sectionId"] },
  execute: ({ sectionId }, context) => {
    const { section, error } = getSection(context, sectionId);
    if (error) return fail(error);
    editorAdapter.deleteComponent(sectionId);
    return ok({ deleted: summarizeNode(section, 0), remaining: context.getState().components.length });
  },
});

export const duplicateSection = defineTool({
  name: "duplicateSection",
  description: "Copies a section, with fresh ids, and appends the copy to the page.",
  parameters: { type: "object", properties: { sectionId: sectionIdParam }, required: ["sectionId"] },
  execute: ({ sectionId }, context) => {
    const { error } = getSection(context, sectionId);
    if (error) return fail(error);

    const before = new Set(context.getState().components.map((n) => n.id));
    editorAdapter.duplicateComponent(sectionId);
    const copy = context.getState().components.find((n) => !before.has(n.id));
    return ok({ duplicateId: copy?.id ?? null, sectionCount: context.getState().components.length });
  },
});

export const moveSection = defineTool({
  name: "moveSection",
  description: "Reorders a section on the page, by absolute index or by one step up/down.",
  parameters: {
    type: "object",
    properties: {
      sectionId: sectionIdParam,
      toIndex: { type: "number", description: "Target index." },
      direction: { type: "string", enum: ["up", "down"], description: "Move one step instead of using toIndex." },
    },
    required: ["sectionId"],
  },
  execute: ({ sectionId, toIndex, direction }, context) => {
    const components = context.getState().components;
    const from = components.findIndex((node) => node.id === sectionId);
    if (from === -1) return fail(`No section found with id '${sectionId}'.`);

    let target = toIndex;
    if (direction) target = direction === "up" ? from - 1 : from + 1;
    if (target === undefined) return fail("Provide either toIndex or direction.");
    if (target < 0 || target >= components.length) {
      return fail(`Index ${target} is outside 0..${components.length - 1}.`);
    }

    editorAdapter.moveComponent(from, target);
    return ok({ fromIndex: from, toIndex: target });
  },
});

export const replaceSection = defineTool({
  name: "replaceSection",
  description: "Swaps a section for a freshly built section of another type, keeping its position on the page.",
  parameters: {
    type: "object",
    properties: {
      sectionId: sectionIdParam,
      type: { type: "string", enum: SECTION_TYPES, description: "Section type to replace it with." },
    },
    required: ["sectionId", "type"],
  },
  execute: ({ sectionId, type }, context) => {
    const { section, error } = getSection(context, sectionId);
    if (error) return fail(error);
    const { node, error: buildError } = buildSection(type);
    if (buildError) return fail(buildError);

    editorAdapter.replaceNode(sectionId, node);
    return ok({ replaced: { id: sectionId, type: section.type }, with: summarizeNode(node, 0) });
  },
});

export const mergeSections = defineTool({
  name: "mergeSections",
  description: "Merges several sections into the first one by appending their children to it, then removes the others.",
  parameters: {
    type: "object",
    properties: {
      sectionIds: { type: "array", items: { type: "string" }, description: "Two or more section ids; the first is kept." },
    },
    required: ["sectionIds"],
  },
  execute: ({ sectionIds }, context) => {
    if (!Array.isArray(sectionIds) || sectionIds.length < 2) return fail("Provide at least two section ids.");

    const sections = [];
    for (const id of sectionIds) {
      const { section, error } = getSection(context, id);
      if (error) return fail(error);
      sections.push(section);
    }

    const [keeper, ...absorbed] = sections;
    const children = [...(keeper.children || []), ...absorbed.flatMap((s) => s.children || [])];

    editorAdapter.updateNode(keeper.id, { children });
    for (const section of absorbed) editorAdapter.deleteNode(section.id);

    return ok({ mergedInto: keeper.id, removed: absorbed.map((s) => s.id), childCount: children.length });
  },
});

export const splitSection = defineTool({
  name: "splitSection",
  description: "Splits one section into two at a child index; the children after the split move into a new section of the same type.",
  parameters: {
    type: "object",
    properties: {
      sectionId: sectionIdParam,
      atIndex: { type: "number", description: "Child index where the second section starts." },
    },
    required: ["sectionId", "atIndex"],
  },
  execute: ({ sectionId, atIndex }, context) => {
    const { section, error } = getSection(context, sectionId);
    if (error) return fail(error);

    const children = section.children || [];
    if (atIndex <= 0 || atIndex >= children.length) {
      return fail(`atIndex must be between 1 and ${children.length - 1}; the section has ${children.length} children.`);
    }

    const { node: tail, error: buildError } = buildSection(section.type);
    if (buildError) return fail(buildError);

    editorAdapter.updateNode(sectionId, { children: children.slice(0, atIndex) });
    editorAdapter.insertNode({ ...tail, children: children.slice(atIndex) }, sectionId, "after");

    return ok({ original: sectionId, newSectionId: tail.id, keptChildren: atIndex, movedChildren: children.length - atIndex });
  },
});

export const toggleSectionVisibility = defineTool({
  name: "toggleSectionVisibility",
  description: "Shows or hides a section without deleting it.",
  parameters: {
    type: "object",
    properties: {
      sectionId: sectionIdParam,
      visible: { type: "boolean", description: "Explicit state. Omit to toggle." },
    },
    required: ["sectionId"],
  },
  execute: ({ sectionId, visible }, context) => {
    const { section, error } = getSection(context, sectionId);
    if (error) return fail(error);

    const hidden = visible === undefined ? !section.hidden : !visible;
    editorAdapter.updateNode(sectionId, { hidden });
    return ok({ sectionId, hidden, visible: !hidden });
  },
});

export const sectionTools = [
  createSection, deleteSection, duplicateSection, moveSection,
  replaceSection, mergeSections, splitSection, toggleSectionVisibility,
];
