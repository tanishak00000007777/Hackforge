/**
 * How each registered type becomes markup on export.
 *
 * The exporter previously special-cased five types and emitted a bare <div>
 * for everything else, so a published page silently lost its lists, cards,
 * badges, inputs and dividers. One table drives both the JSX and the static
 * HTML generator, so a new element type is handled by adding one line here.
 *
 *   tag          HTML element to emit
 *   text         prop holding the element's own text
 *   void         self-closing (no children, no closing tag)
 *   attrs        props copied straight through as attributes
 *   items        prop holding an array rendered as <li> children
 *   className    default classes when the node sets none
 */
export const ELEMENT_TAGS = {
  // sections render as landmarks so exported pages keep their outline
  blank: { tag: "section" },
  hero: { tag: "section" },
  about: { tag: "section" },
  timeline: { tag: "section" },
  tracks: { tag: "section" },
  sponsors: { tag: "section" },
  judges: { tag: "section" },
  faq: { tag: "section" },
  footer: { tag: "footer" },

  // typography
  heading: { tag: "h1", text: "text" },
  paragraph: { tag: "p", text: "text" },
  button: { tag: "button", text: "text", attrs: ["type", "disabled"] },
  badge: { tag: "span", text: "text", className: "badge" },
  list: { tag: "ul", items: "items" },

  // media
  image: { tag: "img", void: true, attrs: ["src", "alt", "width", "height", "loading"] },
  video: { tag: "video", attrs: ["src", "poster", "controls", "autoplay", "loop", "muted"] },

  // layout
  container: { tag: "div" },
  row: { tag: "div", className: "row" },
  column: { tag: "div", className: "column" },
  grid: { tag: "div", className: "grid" },
  divider: { tag: "hr", void: true },
  card: { tag: "div", className: "card" },

  // components
  countdown: { tag: "div", text: "label", className: "countdown", attrs: ["data-target"] },
  accordion: { tag: "div", className: "accordion" },
  tabs: { tag: "div", className: "tabs" },
  map: { tag: "iframe", void: true, attrs: ["src", "title", "loading"] },

  // forms
  input: { tag: "input", void: true, attrs: ["type", "name", "placeholder", "value", "required"] },
  textarea: { tag: "textarea", text: "value", attrs: ["name", "placeholder", "rows", "required"] },
};

export const tagFor = (type) => ELEMENT_TAGS[type] || { tag: "div" };

/** Heading level comes from a prop, not a separate registry entry. */
export function resolveTag(node) {
  const spec = tagFor(node.type);
  if (node.type === "heading") {
    const level = String(node.props?.level || "h1").toLowerCase();
    return { ...spec, tag: /^h[1-6]$/.test(level) ? level : "h1" };
  }
  if (node.type === "list" && node.props?.ordered) return { ...spec, tag: "ol" };
  return spec;
}

/** Items may arrive as an array or as newline/comma separated text. */
export function listItems(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.replace(/^\s*[-*•]\s*/, "").trim())
      .filter(Boolean);
  }
  return [];
}

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Exported pages must not be injectable through canvas text. */
export const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ESCAPES[char]);
