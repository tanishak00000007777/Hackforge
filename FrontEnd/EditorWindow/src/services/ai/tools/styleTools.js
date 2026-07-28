import { defineTool, ok, fail, resolveTarget } from "./defineTool";
import { editorAdapter } from "../EditorAdapter";
import { DEVICES } from "@/builder/responsive/ResponsiveEngine";

const BREAKPOINTS = Object.keys(DEVICES);

/** Numbers mean pixels; strings are already CSS. */
const px = (value) => (typeof value === "number" ? `${value}px` : value);
const raw = (value) => value;

/**
 * Every style tool is the same operation with a different vocabulary: map
 * named design fields onto CSS properties, then write them to `styles` (or to
 * one breakpoint of `responsive`). Declaring the fields keeps the schemas
 * typed for the model without nine copies of the same body.
 */
function styleTool({ name, description, fields }) {
  const properties = {
    componentId: { type: "string", description: "Target component. Defaults to the current selection." },
    breakpoint: { type: "string", enum: BREAKPOINTS, description: "Apply only at this breakpoint. Omit for all viewports." },
  };
  for (const [field, spec] of Object.entries(fields)) {
    properties[field] = { type: spec.type, description: spec.description, ...(spec.enum ? { enum: spec.enum } : {}) };
  }

  return defineTool({
    name,
    description,
    parameters: { type: "object", properties },
    execute: ({ componentId, breakpoint, ...args }, context) => {
      const { node, error } = resolveTarget(context, componentId);
      if (error) return fail(error);
      if (breakpoint && !BREAKPOINTS.includes(breakpoint)) {
        return fail(`Unknown breakpoint '${breakpoint}'. Expected one of: ${BREAKPOINTS.join(", ")}.`);
      }

      const styles = {};
      for (const [field, value] of Object.entries(args)) {
        const spec = fields[field];
        if (!spec || value === undefined || value === null) continue;
        if (spec.enum && !spec.enum.includes(value)) {
          return fail(`'${value}' is not valid for ${field}. Expected one of: ${spec.enum.join(", ")}.`);
        }
        styles[spec.css] = (spec.transform || raw)(value);
      }

      if (Object.keys(styles).length === 0) {
        return fail(`No style values given. Supported fields: ${Object.keys(fields).join(", ")}.`);
      }

      editorAdapter.updateNode(node.id, breakpoint ? { responsive: { [breakpoint]: styles } } : { styles });
      return ok({ componentId: node.id, breakpoint: breakpoint || "all", applied: styles });
    },
  });
}

export const updateTypography = styleTool({
  name: "updateTypography",
  description: "Sets font family, size, weight, line height, letter spacing, text transform or decoration on a component.",
  fields: {
    fontFamily: { css: "fontFamily", type: "string", description: "Font family name." },
    fontSize: { css: "fontSize", type: "number", description: "Font size in pixels.", transform: px },
    fontWeight: { css: "fontWeight", type: "number", description: "100-900." },
    lineHeight: { css: "lineHeight", type: "number", description: "Line height in pixels.", transform: px },
    letterSpacing: { css: "letterSpacing", type: "number", description: "Letter spacing in pixels.", transform: px },
    textTransform: { css: "textTransform", type: "string", enum: ["none", "uppercase", "lowercase", "capitalize"], description: "Casing." },
    textDecoration: { css: "textDecoration", type: "string", enum: ["none", "underline", "line-through"], description: "Decoration." },
    fontStyle: { css: "fontStyle", type: "string", enum: ["normal", "italic"], description: "Style." },
  },
});

export const updateColors = styleTool({
  name: "updateColors",
  description: "Sets text colour, background colour or gradient, and opacity.",
  fields: {
    color: { css: "color", type: "string", description: "Text colour, e.g. '#111827'." },
    backgroundColor: { css: "backgroundColor", type: "string", description: "Background colour." },
    background: { css: "background", type: "string", description: "Full background shorthand, e.g. a gradient." },
    opacity: { css: "opacity", type: "number", description: "0 to 1." },
  },
});

export const updateSpacing = styleTool({
  name: "updateSpacing",
  description: "Sets padding, margin and gap. Prefer multiples of 8 to stay on the project's spacing grid.",
  fields: {
    padding: { css: "padding", type: "number", description: "Padding on all sides, in pixels.", transform: px },
    paddingTop: { css: "paddingTop", type: "number", description: "Top padding in pixels.", transform: px },
    paddingRight: { css: "paddingRight", type: "number", description: "Right padding in pixels.", transform: px },
    paddingBottom: { css: "paddingBottom", type: "number", description: "Bottom padding in pixels.", transform: px },
    paddingLeft: { css: "paddingLeft", type: "number", description: "Left padding in pixels.", transform: px },
    margin: { css: "margin", type: "number", description: "Margin on all sides, in pixels.", transform: px },
    marginTop: { css: "marginTop", type: "number", description: "Top margin in pixels.", transform: px },
    marginBottom: { css: "marginBottom", type: "number", description: "Bottom margin in pixels.", transform: px },
    gap: { css: "gap", type: "number", description: "Gap between children, in pixels.", transform: px },
  },
});

export const updateBorders = styleTool({
  name: "updateBorders",
  description: "Sets border width, style, colour and corner radius.",
  fields: {
    borderWidth: { css: "borderWidth", type: "number", description: "Border width in pixels.", transform: px },
    borderStyle: { css: "borderStyle", type: "string", enum: ["none", "solid", "dashed", "dotted"], description: "Border style." },
    borderColor: { css: "borderColor", type: "string", description: "Border colour." },
    borderRadius: { css: "borderRadius", type: "number", description: "Corner radius in pixels.", transform: px },
  },
});

export const updateShadows = styleTool({
  name: "updateShadows",
  description: "Sets box shadow or text shadow.",
  fields: {
    boxShadow: { css: "boxShadow", type: "string", description: "Full CSS box-shadow, e.g. '0 4px 12px rgba(0,0,0,0.1)'." },
    textShadow: { css: "textShadow", type: "string", description: "Full CSS text-shadow." },
  },
});

export const updateEffects = styleTool({
  name: "updateEffects",
  description: "Sets visual effects: blur, backdrop blur, transform, transition and overflow.",
  fields: {
    filter: { css: "filter", type: "string", description: "CSS filter, e.g. 'blur(4px)'." },
    backdropFilter: { css: "backdropFilter", type: "string", description: "CSS backdrop-filter." },
    transform: { css: "transform", type: "string", description: "CSS transform, e.g. 'scale(1.05)'." },
    transition: { css: "transition", type: "string", description: "CSS transition, e.g. 'all 0.2s ease'." },
    overflow: { css: "overflow", type: "string", enum: ["visible", "hidden", "auto", "scroll"], description: "Overflow behaviour." },
  },
});

export const updateAlignment = styleTool({
  name: "updateAlignment",
  description: "Sets layout direction and alignment: flex/grid direction, justify, align, and text alignment.",
  fields: {
    display: { css: "display", type: "string", enum: ["block", "flex", "grid", "inline-flex", "none"], description: "Display mode." },
    flexDirection: { css: "flexDirection", type: "string", enum: ["row", "column", "row-reverse", "column-reverse"], description: "Flex direction." },
    justifyContent: { css: "justifyContent", type: "string", enum: ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"], description: "Main-axis alignment." },
    alignItems: { css: "alignItems", type: "string", enum: ["flex-start", "center", "flex-end", "stretch", "baseline"], description: "Cross-axis alignment." },
    textAlign: { css: "textAlign", type: "string", enum: ["left", "center", "right", "justify"], description: "Text alignment." },
    flexWrap: { css: "flexWrap", type: "string", enum: ["nowrap", "wrap"], description: "Wrapping." },
  },
});

export const updateAnimation = styleTool({
  name: "updateAnimation",
  description: "Sets CSS animation properties on a component.",
  fields: {
    animationName: { css: "animationName", type: "string", description: "Keyframe animation name." },
    animationDuration: { css: "animationDuration", type: "string", description: "Duration, e.g. '0.4s'." },
    animationTimingFunction: { css: "animationTimingFunction", type: "string", description: "Easing, e.g. 'ease-out'." },
    animationDelay: { css: "animationDelay", type: "string", description: "Delay, e.g. '0.1s'." },
    animationIterationCount: { css: "animationIterationCount", type: "string", description: "Repeat count or 'infinite'." },
  },
});

/** Named looks, so the model can apply a coherent set instead of guessing values. */
export const STYLE_PRESETS = {
  "card-soft": { borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", padding: "24px", backgroundColor: "#FFFFFF" },
  "card-flat": { borderRadius: "12px", border: "1px solid #E5E7EB", padding: "24px", boxShadow: "none" },
  "glass": { backgroundColor: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.4)" },
  "hero-centered": { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "24px", paddingTop: "96px", paddingBottom: "96px" },
  "cta-primary": { backgroundColor: "#2B0A5A", color: "#FFFFFF", borderRadius: "12px", padding: "16px", fontWeight: 600 },
  "cta-ghost": { backgroundColor: "transparent", color: "#2B0A5A", border: "1px solid #2B0A5A", borderRadius: "12px", padding: "16px" },
  "section-tight": { paddingTop: "48px", paddingBottom: "48px", gap: "16px" },
  "section-airy": { paddingTop: "112px", paddingBottom: "112px", gap: "40px" },
};

export const applyStylePreset = defineTool({
  name: "applyStylePreset",
  description: "Applies a named, pre-designed set of styles to a component.",
  parameters: {
    type: "object",
    properties: {
      componentId: { type: "string", description: "Target component. Defaults to the current selection." },
      preset: { type: "string", enum: Object.keys(STYLE_PRESETS), description: `One of: ${Object.keys(STYLE_PRESETS).join(", ")}.` },
      breakpoint: { type: "string", enum: BREAKPOINTS, description: "Apply only at this breakpoint." },
    },
    required: ["preset"],
  },
  execute: ({ componentId, preset, breakpoint }, context) => {
    const styles = STYLE_PRESETS[preset];
    if (!styles) return fail(`Unknown preset '${preset}'. Available: ${Object.keys(STYLE_PRESETS).join(", ")}.`);

    const { node, error } = resolveTarget(context, componentId);
    if (error) return fail(error);

    editorAdapter.updateNode(node.id, breakpoint ? { responsive: { [breakpoint]: styles } } : { styles });
    return ok({ componentId: node.id, preset, breakpoint: breakpoint || "all", applied: styles });
  },
});

export const styleTools = [
  updateTypography, updateColors, updateSpacing, updateBorders, updateShadows,
  updateEffects, updateAlignment, updateAnimation, applyStylePreset,
];
