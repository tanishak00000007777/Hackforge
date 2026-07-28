import { defineTool, ok, fail, resolveTarget } from "./defineTool";
import { editorAdapter } from "../EditorAdapter";
import { DEVICES, computeStyles } from "@/builder/responsive/ResponsiveEngine";

const BREAKPOINTS = Object.keys(DEVICES);
const bpParam = (description) => ({ type: "string", enum: BREAKPOINTS, description });

export const setResponsiveStyle = defineTool({
  name: "setResponsiveStyle",
  description: "Writes style overrides that apply only at one breakpoint. Styles cascade desktop to tablet to mobile.",
  parameters: {
    type: "object",
    properties: {
      componentId: { type: "string", description: "Target component. Defaults to the current selection." },
      breakpoint: bpParam("Breakpoint to write to."),
      styles: { type: "object", description: "CSS properties in camelCase, e.g. { fontSize: '32px', paddingTop: '48px' }." },
    },
    required: ["breakpoint", "styles"],
  },
  execute: ({ componentId, breakpoint, styles }, context) => {
    if (!BREAKPOINTS.includes(breakpoint)) return fail(`Unknown breakpoint '${breakpoint}'. Expected: ${BREAKPOINTS.join(", ")}.`);
    if (typeof styles !== "object" || Array.isArray(styles) || !Object.keys(styles).length) {
      return fail("styles must be a non-empty object of CSS properties.");
    }

    const { node, error } = resolveTarget(context, componentId);
    if (error) return fail(error);

    editorAdapter.updateNode(node.id, { responsive: { [breakpoint]: styles } });
    return ok({ componentId: node.id, breakpoint, applied: styles });
  },
});

export const copyResponsiveStyle = defineTool({
  name: "copyResponsiveStyle",
  description: "Copies a component's overrides from one breakpoint to another, so a layout tuned for tablet can seed mobile.",
  parameters: {
    type: "object",
    properties: {
      componentId: { type: "string", description: "Target component. Defaults to the current selection." },
      from: bpParam("Breakpoint to copy from."),
      to: bpParam("Breakpoint to copy to."),
      overwrite: { type: "boolean", description: "Replace existing values at the destination (default true)." },
    },
    required: ["from", "to"],
  },
  execute: ({ componentId, from, to, overwrite = true }, context) => {
    for (const [label, value] of [["from", from], ["to", to]]) {
      if (!BREAKPOINTS.includes(value)) return fail(`Unknown breakpoint '${value}' for ${label}. Expected: ${BREAKPOINTS.join(", ")}.`);
    }
    if (from === to) return fail("'from' and 'to' must be different breakpoints.");

    const { node, error } = resolveTarget(context, componentId);
    if (error) return fail(error);

    const source = node.responsive?.[from] || {};
    if (!Object.keys(source).length) return fail(`Component '${node.id}' has no overrides at '${from}'.`);

    const destination = node.responsive?.[to] || {};
    const merged = overwrite ? { ...destination, ...source } : { ...source, ...destination };

    editorAdapter.updateNode(node.id, { responsive: { [to]: merged } });
    return ok({ componentId: node.id, from, to, copied: Object.keys(source), result: merged });
  },
});

export const toggleResponsiveVisibility = defineTool({
  name: "toggleResponsiveVisibility",
  description: "Shows or hides a component at one breakpoint only, by setting display at that breakpoint.",
  parameters: {
    type: "object",
    properties: {
      componentId: { type: "string", description: "Target component. Defaults to the current selection." },
      breakpoint: bpParam("Breakpoint to change."),
      visible: { type: "boolean", description: "true to show, false to hide." },
    },
    required: ["breakpoint", "visible"],
  },
  execute: ({ componentId, breakpoint, visible }, context) => {
    if (!BREAKPOINTS.includes(breakpoint)) return fail(`Unknown breakpoint '${breakpoint}'. Expected: ${BREAKPOINTS.join(", ")}.`);

    const { node, error } = resolveTarget(context, componentId);
    if (error) return fail(error);

    // Restore the base display rather than forcing 'block' back on.
    const base = computeStyles(node.styles || {}, {}, breakpoint).display || "block";
    const display = visible ? base : "none";

    editorAdapter.updateNode(node.id, { responsive: { [breakpoint]: { display } } });
    return ok({ componentId: node.id, breakpoint, visible, display });
  },
});

export const previewBreakpoint = defineTool({
  name: "previewBreakpoint",
  description: "Switches the canvas to a breakpoint and returns the styles a component actually resolves to there.",
  parameters: {
    type: "object",
    properties: {
      breakpoint: bpParam("Breakpoint to preview."),
      componentId: { type: "string", description: "Component to report computed styles for. Defaults to the current selection." },
    },
    required: ["breakpoint"],
  },
  execute: ({ breakpoint, componentId }, context) => {
    if (!BREAKPOINTS.includes(breakpoint)) return fail(`Unknown breakpoint '${breakpoint}'. Expected: ${BREAKPOINTS.join(", ")}.`);

    editorAdapter.setDevice(breakpoint);

    const node = context.resolveNode(componentId);
    return ok({
      breakpoint,
      viewport: context.getState().device,
      component: node
        ? {
            id: node.id,
            type: node.type,
            computedStyles: computeStyles(node.styles || {}, node.responsive || {}, breakpoint),
            overridesAtBreakpoint: node.responsive?.[breakpoint] || {},
          }
        : null,
    });
  },
});

export const responsiveTools = [setResponsiveStyle, copyResponsiveStyle, toggleResponsiveVisibility, previewBreakpoint];
