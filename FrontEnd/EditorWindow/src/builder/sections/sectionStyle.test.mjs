// Run: npm test
//
// Regression: "Make this blank dark" reported Done and changed nothing. Every
// section Preview spread props.styles FIRST and then re-applied
// `background: props.background ?? "#FFF"`, so an explicit style edit was
// overwritten by the section's own default before it ever reached the canvas.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { sectionStyle, SECTION_STYLE_ALIASES } from "./sectionStyle.js";

/* --- defaults apply when nothing explicit is set --- */
assert.deepEqual(
  sectionStyle({}, { background: "#F8FAFC", paddingTop: 96, paddingBottom: 96 }),
  { background: "#F8FAFC", paddingTop: "96px", paddingBottom: "96px" },
);

/* --- props override the built-in defaults --- */
assert.equal(sectionStyle({ background: "#000000" }, { background: "#FFFFFF" }).background, "#000000");
assert.equal(sectionStyle({ paddingTop: 24 }, {}).paddingTop, "24px");

/* --- the reported case: an AI style edit must win over the default --- */
const aiDark = sectionStyle({ styles: { backgroundColor: "#111827" } }, { background: "#FFFFFF" });
assert.equal(aiDark.backgroundColor, "#111827", "the explicit edit must survive");
assert.deepEqual(
  Object.keys(aiDark).slice(-1),
  ["backgroundColor"],
  "styles must be applied last so backgroundColor beats the background shorthand",
);

/* --- and over an explicit prop too, whichever key the tool used --- */
assert.equal(
  sectionStyle({ background: "#FFFFFF", styles: { background: "#111827" } }, {}).background,
  "#111827",
);

/* --- spacing edits reach the canvas as well --- */
assert.equal(sectionStyle({ styles: { paddingTop: "160px" } }, { paddingTop: 96 }).paddingTop, "160px");

/* --- unrelated style properties pass straight through --- */
const rich = sectionStyle({ styles: { borderRadius: "24px", boxShadow: "0 4px 12px rgba(0,0,0,.1)" } }, {});
assert.equal(rich.borderRadius, "24px");
assert.equal(rich.boxShadow, "0 4px 12px rgba(0,0,0,.1)");

/* --- no section may reintroduce the inverted order --- */
for (const dir of readdirSync(new URL(".", import.meta.url)).filter((entry) => !entry.includes("."))) {
  const source = readFileSync(new URL(`./${dir}/Preview.jsx`, import.meta.url), "utf8");
  assert.ok(source.includes("sectionStyle("), `${dir}/Preview.jsx must use the shared sectionStyle helper`);
  assert.ok(
    !/\.\.\.props\.styles,\s*background:/.test(source),
    `${dir}/Preview.jsx re-applies background after spreading styles -- edits would be discarded`,
  );
}

/* --- the Inspector clears the style twins so its own edit is not masked --- */
assert.deepEqual(SECTION_STYLE_ALIASES.background, ["background", "backgroundColor"]);
const fieldRenderer = readFileSync(
  new URL("../../components/studio/Inspector/FieldRenderer.jsx", import.meta.url),
  "utf8",
);
assert.ok(fieldRenderer.includes("SECTION_STYLE_ALIASES"), "FieldRenderer must clear aliased style keys");

console.log("sectionStyle: all checks passed");
