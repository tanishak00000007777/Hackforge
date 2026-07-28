// Run: node --import ./alias-loader.mjs src/builder/utils/CodeGenerator.test.mjs
//
// The exporter used to special-case 5 types and emit an empty <div> for the
// other 14, so publishing silently dropped lists, cards, inputs and dividers.
import assert from "node:assert/strict";
import { generateJSX, generateHTML, generateCSS } from "./CodeGenerator.js";
import { ELEMENT_TAGS } from "./elementTags.js";

const page = [
  {
    id: "sec1", type: "blank", props: { background: "#000000", paddingTop: 96 }, children: [
      { id: "h1", type: "heading", props: { text: "Problem Statement", level: "h2" }, styles: { color: "#2563eb", textAlign: "center" }, children: [] },
      { id: "l1", type: "list", props: { items: ["Point 1", "Point 2", "Point 3"] }, children: [] },
      { id: "i1", type: "image", props: { src: "/hero.png", alt: "Hero" }, children: [] },
      { id: "d1", type: "divider", props: {}, children: [] },
      { id: "in1", type: "input", props: { type: "email", placeholder: "you@example.com", required: true }, children: [] },
      { id: "b1", type: "badge", props: { text: "New" }, children: [] },
    ],
  },
];

const jsx = generateJSX(page);
const html = generateHTML(page, {}, { title: "Demo" });

// --- every element reaches the output, not just the five old special cases ---
for (const [needle, label] of [
  ["Problem Statement", "heading text"],
  ["Point 1", "list items"],
  ["/hero.png", "image src"],
  ['alt="Hero"', "image alt"],
  ["<hr", "divider"],
  ['placeholder="you@example.com"', "input attrs"],
  ["New", "badge text"],
]) {
  assert.ok(html.includes(needle), `static HTML lost ${label}`);
}
assert.ok(jsx.includes("Problem Statement") && jsx.includes("Point 1") && jsx.includes("/hero.png"), "JSX lost content");

// --- semantics, not a pile of divs ---
assert.ok(html.includes("<section"), "sections must stay sections");
assert.ok(html.includes("<h2"), "heading level comes from props.level");
assert.ok(html.includes("<ul"), "unordered list");
assert.ok(generateHTML([{ id: "o", type: "list", props: { items: ["a"], ordered: true }, children: [] }]).includes("<ol"));
assert.equal((html.match(/<li>/g) || []).length, 3, "one <li> per item");

// --- void elements are not given closing tags ---
assert.ok(!html.includes("</hr>") && !html.includes("</img>") && !html.includes("</input>"));
assert.ok(jsx.includes("/>"), "JSX void elements self-close");

// --- section props become real styles ---
assert.ok(html.includes("background: #000000"), "section background must survive export");
assert.ok(html.includes("padding-top: 96px"), "camelCase styles become CSS properties");
assert.ok(jsx.includes("background: '#000000'"));

// --- hidden nodes are excluded from a published page ---
const withHidden = generateHTML([{ id: "x", type: "paragraph", props: { text: "secret" }, hidden: true, children: [] }]);
assert.ok(!withHidden.includes("secret"), "hidden nodes must not be published");

// --- canvas text cannot inject markup into the exported page ---
const injected = generateHTML([{ id: "p", type: "paragraph", props: { text: '<script>alert(1)</script>' }, children: [] }]);
assert.ok(!injected.includes("<script>alert"), "text must be escaped");
assert.ok(injected.includes("&lt;script&gt;"));

// --- theme tokens reach the stylesheet (the shape bug fixed earlier) ---
const css = generateCSS({ mode: "light", tokens: { light: { color: { primary: "#2B0A5A" }, typography: { fontFamily: "Inter" } } } });
assert.ok(css.includes("--token-color-primary: #2B0A5A"));
assert.ok(css.includes("--token-typography-fontFamily: Inter"));

// --- every registered type has an export mapping ---
const registered = [
  "blank", "hero", "about", "timeline", "tracks", "sponsors", "judges", "faq", "footer",
  "heading", "paragraph", "button", "image", "container", "row", "column", "grid",
  "divider", "badge", "card", "video", "countdown", "accordion", "tabs", "input", "textarea", "map", "list",
];
for (const type of registered) {
  assert.ok(ELEMENT_TAGS[type], `no export mapping for '${type}' -- it would publish as an empty div`);
}

console.log("CodeGenerator: all checks passed");
