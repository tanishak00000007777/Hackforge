import { defineTool, ok, fail, summarizeNode } from "./defineTool";
import { editorAdapter } from "../EditorAdapter";
import * as coreFactory from "@/builder/factories/coreFactory";
import { elementRegistry } from "@/builder/registry";

/**
 * One-shot section building.
 *
 * The old path was: createSection (a fixed factory preset) and then, in theory,
 * a chain of updateColors/updateTypography/updateSpacing calls to make it look
 * like anything. In practice the chain never happened -- the preset landed
 * unstyled and the turn ended -- so every "build me a hero" produced the same
 * grey default. Chaining ~10 dependent tool calls is also exactly what a
 * free-tier model is worst at.
 *
 * composeSection collapses that into a single call carrying the whole styled
 * tree, which is how a code-generating assistant gets a designed result in one
 * shot. Copy, layout and CSS arrive together or not at all.
 */

const ELEMENT_TYPES = Object.keys(elementRegistry);

/** Text lives under a different prop per element; the model shouldn't have to know. */
const TEXT_PROP = { button: "label" };

const MAX_NODES = 60;
const MAX_DEPTH = 6;

/**
 * The canvas renders the user's generated site and does not load ForgeAI's own
 * stylesheet, so `var(--color-surface)` resolves to nothing and renders
 * transparent. A model that has just read a token-based design system reaches
 * for those names constantly, and the failure is invisible: the tool succeeds
 * and the section renders unstyled. Rejecting it puts a precise message back in
 * front of the model, which then retries with literal values.
 */
const CANVAS_VARS = /var\(\s*--/;

function findUnresolvableVars(styles = {}, path = "") {
  return Object.entries(styles)
    .filter(([, value]) => typeof value === "string" && CANVAS_VARS.test(value))
    .map(([key, value]) => `${path}${key}: "${value}"`);
}

/**
 * Section padding is a number of px; the Preview interpolates it as
 * `${paddingTop}px`. A string like "space-20" or "128px" would produce
 * "space-20px" / "128pxpx", so normalise here rather than trusting the caller.
 */
function coercePx(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const match = /^\s*(-?\d+(?:\.\d+)?)\s*(px)?\s*$/.exec(value);
    if (match) return Number(match[1]);
  }
  return undefined;
}

/**
 * Turn one spec node into a real editor node. Unknown types fail loudly rather
 * than silently vanishing at render time -- ElementRenderer skips types it does
 * not recognise, so a typo would otherwise produce a half-built section with no
 * explanation.
 */
function buildNode(spec, depth, counter) {
  if (depth > MAX_DEPTH) return { error: `Nesting deeper than ${MAX_DEPTH} levels.` };
  if (!spec || typeof spec !== "object") return { error: "Each child must be an object." };

  const { type, text, props = {}, styles = {}, children = [] } = spec;
  if (!type) return { error: "Every child needs a 'type'." };
  if (!ELEMENT_TYPES.includes(type)) {
    return { error: `Unknown element type '${type}'. Valid types: ${ELEMENT_TYPES.join(", ")}.` };
  }

  if (++counter.n > MAX_NODES) return { error: `A section may not exceed ${MAX_NODES} nodes.` };

  const bad = findUnresolvableVars(styles, `${type}.styles.`);
  if (bad.length) {
    return { error:
      `CSS variables do not resolve on the canvas — ${bad.join("; ")}. ` +
      "Use literal values (hex, rgba, px) taken from the THEME tokens in SYSTEM CONTEXT." };
  }

  const node = coreFactory.createElement(type);
  if (!node) return { error: `Could not create a '${type}' element.` };

  node.props = { ...node.props, ...props };
  if (typeof text === "string") node.props[TEXT_PROP[type] || "text"] = text;
  node.styles = { ...node.styles, ...styles };

  const built = [];
  for (const child of children) {
    const result = buildNode(child, depth + 1, counter);
    if (result.error) return result;
    built.push(result.node);
  }
  // createElement already assigned ids to the (empty) default subtree; children
  // we build carry their own, so append rather than re-running assignIds.
  node.children = [...(node.children || []), ...built];

  return { node };
}

export const composeSection = defineTool({
  name: "composeSection",
  description:
    "Builds a COMPLETE, fully styled section in one call: layout, copy and CSS together. " +
    "Use this for any 'add/create/build a <section>' request instead of createSection — " +
    "createSection only drops an unstyled preset. Provide real copy and real styles for " +
    "every child; anything you leave out renders as an unstyled default.",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "What you are building, e.g. 'hero', 'features', 'cta'. Used for the summary only.",
      },
      section: {
        type: "object",
        description:
          "The section shell. { background, paddingTop, paddingBottom, styles }. " +
          "`background` accepts a CSS gradient. `styles` is any CSS object and wins over the others.",
      },
      children: {
        type: "array",
        description:
          "The section's content tree. Each item is " +
          "{ type, text, props, styles, children }. `type` is one of: " +
          ELEMENT_TYPES.join(", ") +
          ". `text` sets the visible copy. `styles` is a CSS object (camelCase keys) — " +
          "set fontSize, fontWeight, color, margin, padding, display, gap etc. explicitly. " +
          "Wrap content in a 'container' child to constrain width.",
        items: { type: "object" },
      },
      index: { type: "number", description: "Position to insert at. Omit to append." },
    },
    required: ["children"],
  },
  execute: ({ name = "section", section = {}, children = [], index }, context) => {
    if (!Array.isArray(children) || children.length === 0) {
      return fail("`children` must be a non-empty array — a section with no content is never the goal.");
    }

    const node = coreFactory.createComponent("blank");
    if (!node) return fail("Could not create the section shell.");

    const { background, paddingTop, paddingBottom, styles = {} } = section;

    const shellBad = [
      ...findUnresolvableVars(styles, "section.styles."),
      ...(typeof background === "string" && CANVAS_VARS.test(background)
        ? [`section.background: "${background}"`]
        : []),
    ];
    if (shellBad.length) {
      return fail(
        `CSS variables do not resolve on the canvas — ${shellBad.join("; ")}. ` +
          "Use literal values (hex, rgba, gradient) taken from the THEME tokens in SYSTEM CONTEXT.",
      );
    }

    const top = coercePx(paddingTop);
    const bottom = coercePx(paddingBottom);
    node.props = {
      ...node.props,
      ...(background !== undefined && { background }),
      ...(top !== undefined && { paddingTop: top }),
      ...(bottom !== undefined && { paddingBottom: bottom }),
    };
    node.styles = { ...node.styles, ...styles };

    const counter = { n: 0 };
    const built = [];
    for (const child of children) {
      const result = buildNode(child, 1, counter);
      if (result.error) return fail(result.error);
      built.push(result.node);
    }

    // The blank preset ships one empty container; fill it so the content stays
    // width-constrained, instead of leaving an empty wrapper beside the content.
    const wrapper = node.children?.[0];
    if (wrapper && wrapper.type === "container" && !wrapper.children?.length) {
      // The design rules tell the model to wrap content in a container, and the
      // preset already provides one. Nesting both leaves a redundant div that
      // swallows the outer max-width, so a lone container spec is merged into
      // the preset wrapper rather than placed inside it.
      const [only] = built;
      if (built.length === 1 && only.type === "container") {
        wrapper.props = { ...wrapper.props, ...only.props };
        wrapper.styles = { ...wrapper.styles, ...only.styles };
        wrapper.children = only.children;
      } else {
        wrapper.children = built;
      }
    } else {
      node.children = [...(node.children || []), ...built];
    }

    editorAdapter.addComponent(node);
    if (index !== undefined) {
      editorAdapter.moveComponent(context.getState().components.length - 1, index);
    }

    return ok({
      built: name,
      sectionId: node.id,
      nodes: counter.n,
      tree: summarizeNode(node, 2),
    });
  },
});

export const composeTools = [composeSection];
