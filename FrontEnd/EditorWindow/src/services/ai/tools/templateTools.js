import { defineTool, ok, fail, resolveTarget, summarizeNode } from "./defineTool";
import { useEditorStore } from "@/store/editorStore";
import { duplicateNode } from "@/builder/factories/coreFactory";
import { editorAdapter } from "../EditorAdapter";
import { listTemplates } from "@/builder/registry/templates";

const TEMPLATE_TYPES = ["section", "page", "website"];

const store = () => useEditorStore.getState();
// Built-in templates are not in the store (see editorStore), so every
// lookup has to go through listTemplates or the AI cannot see them.
const templates = () => listTemplates(store().savedTemplates);

const describe = (template) => ({
  id: template.id,
  name: template.name,
  type: template.type,
  sectionCount: template.type === "section" ? 1 : template.data?.components?.length || 0,
});

export const saveTemplate = defineTool({
  name: "saveTemplate",
  description: "Saves a section, or the whole page, to the template library for reuse.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Name to save it under." },
      type: { type: "string", enum: TEMPLATE_TYPES, description: "section saves one component; page/website saves the whole canvas." },
      sectionId: { type: "string", description: "Section to save when type is 'section'. Defaults to the current selection." },
    },
    required: ["name"],
  },
  execute: ({ name, type = "section", sectionId }, context) => {
    if (!TEMPLATE_TYPES.includes(type)) return fail(`Unknown template type '${type}'. Expected: ${TEMPLATE_TYPES.join(", ")}.`);
    if (!String(name).trim()) return fail("Template name cannot be empty.");

    let data;
    if (type === "section") {
      const { node, error } = resolveTarget(context, sectionId);
      if (error) return fail(error);
      data = structuredClone(node);
    } else {
      const state = store();
      data = { components: structuredClone(state.components), globalTheme: structuredClone(state.globalTheme) };
    }

    const template = { id: crypto.randomUUID(), name: String(name).trim(), type, data };
    store().saveTemplate(template);
    return ok({ template: describe(template) });
  },
});

export const loadTemplate = defineTool({
  name: "loadTemplate",
  description: "Returns a template's contents without applying it, so it can be inspected first.",
  parameters: {
    type: "object",
    properties: { templateId: { type: "string", description: "Id of the template." } },
    required: ["templateId"],
  },
  execute: ({ templateId }) => {
    const template = templates().find((t) => t.id === templateId);
    if (!template) return fail(`No template found with id '${templateId}'.`);

    return ok({
      ...describe(template),
      preview: template.type === "section"
        ? summarizeNode(template.data, 1)
        : (template.data.components || []).map((node) => summarizeNode(node, 0)),
    });
  },
});

export const searchTemplates = defineTool({
  name: "searchTemplates",
  description: "Lists templates in the library, optionally filtered by name or type.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Case-insensitive substring of the template name." },
      type: { type: "string", enum: TEMPLATE_TYPES, description: "Only return this template type." },
    },
  },
  execute: ({ query, type }) => {
    const needle = query?.toLowerCase();
    const matches = templates().filter((template) => {
      if (type && template.type !== type) return false;
      if (needle && !template.name.toLowerCase().includes(needle)) return false;
      return true;
    });
    return ok({ matchCount: matches.length, templates: matches.map(describe) });
  },
});

export const applyTemplate = defineTool({
  name: "applyTemplate",
  description: "Applies a template. Section templates are appended; page and website templates replace the canvas, so they need confirmReplace.",
  parameters: {
    type: "object",
    properties: {
      templateId: { type: "string", description: "Id of the template to apply." },
      confirmReplace: { type: "boolean", description: "Required for page/website templates, which discard the current canvas." },
    },
    required: ["templateId"],
  },
  execute: ({ templateId, confirmReplace }) => {
    const template = templates().find((t) => t.id === templateId);
    if (!template) return fail(`No template found with id '${templateId}'.`);

    if (template.type === "section") {
      const copy = duplicateNode(template.data);
      editorAdapter.addComponent(copy);
      return ok({ applied: describe(template), newSectionId: copy.id, replacedCanvas: false });
    }

    if (!confirmReplace) {
      return fail(`Applying '${template.name}' discards the current canvas (${store().components.length} sections). Call again with confirmReplace: true.`);
    }

    const components = (template.data.components || []).map((node) => duplicateNode(node));
    store().loadProjectTemplate({ components, globalTheme: template.data.globalTheme });
    return ok({ applied: describe(template), sectionCount: components.length, replacedCanvas: true });
  },
});

export const templateTools = [saveTemplate, loadTemplate, searchTemplates, applyTemplate];
