// Run: node --import ./alias-loader.mjs src/services/ai/ToolRouter.test.mjs
import assert from "node:assert/strict";
import { toolRegistry } from "./ToolRegistry.js";
import { selectTools, searchToolIndex, CORE_TOOL_NAMES } from "./ToolRouter.js";

// Register stand-ins with the real names and descriptions. The router only
// reads name/description, so this exercises the real ranking without pulling
// the store and JSX into a node process.
const p = (...keys) => ({ type: "object", properties: Object.fromEntries(keys.map((k) => [k, { type: "string" }])) });

const TOOLS = [
  ["getCanvasState", "Returns the current viewport, zoom, pan, selection, theme mode and history depth.", p()],
  ["getSelection", "Returns the ids and summaries of the currently selected components.", p()],
  ["findComponent", "Finds components by type and/or text content.", p("type", "text", "limit")],
  ["inspectComponent", "Returns everything about one component: props, styles, responsive overrides.", p("componentId")],
  ["discoverTools", "Finds editor tools that are not in the current list.", p("query", "limit")],
  ["callTool", "Runs any editor tool by name, including ones not listed in this turn.", p("name", "args")],
  ["updateTypography", "Sets font family, size, weight, line height, letter spacing on a component.",
    p("componentId", "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform")],
  ["updateColors", "Sets text colour, background colour or gradient, and opacity.",
    p("componentId", "color", "backgroundColor", "background", "opacity")],
  ["updateSpacing", "Sets padding, margin and gap.", p("componentId", "padding", "margin", "gap", "paddingTop")],
  ["updateBorders", "Sets border width, style, colour and corner radius.",
    p("componentId", "borderWidth", "borderStyle", "borderColor", "borderRadius")],
  ["createSection", "Adds a new section to the page.", p("type", "index")],
  ["deleteSection", "Removes a section and everything inside it.", p("sectionId")],
  ["duplicateSection", "Copies a section and appends the copy to the page.", p("sectionId")],
  ["mergeSections", "Merges several sections into the first one.", p("sectionIds")],
  ["changeElementType", "Converts an element to another type, carrying over props and styles.", p("elementId", "newType")],
  ["setContent", "Sets a heading, paragraph, button, or other component's text to an exact value without paraphrasing it.",
    p("componentId", "value")],
  ["changeTone", "Rewrites a component's text in a different tone of voice.", p("componentId", "tone")],
  ["validateChanges", "Dry-runs a list of tool calls and reports problems.", p("actions")],
  ["rollbackChanges", "Undoes recent changes.", p("steps")],
  ["setResponsiveStyle", "Writes style overrides that apply only at one breakpoint.", p("componentId", "breakpoint", "styles")],
  ["toggleResponsiveVisibility", "Shows or hides a component at one breakpoint only.", p("componentId", "breakpoint", "visible")],
  ["applyTheme", "Applies a named colour preset to the whole site.", p("preset", "mode")],
  ["switchColorScheme", "Switches the site between light and dark mode.", p("mode")],
  ["translateContent", "Translates a component's text into another language.", p("componentId", "language")],
  ["fixGrammar", "Corrects spelling, grammar and punctuation.", p("componentId")],
  ["analyzeAccessibility", "Checks alt text, button labels, form labelling and minimum font sizes.", p("rootId")],
  ["auditProject", "Runs every analyzer and returns one ranked list of findings.", p("rootId", "minSeverity")],
  ["saveTemplate", "Saves a section, or the whole page, to the template library.", p("name", "type", "sectionId")],
  ["uploadAsset", "Registers an asset URL in the project's asset library.", p("url", "name", "type")],
  ["groupElements", "Collects sibling elements into one new container.", p("elementIds", "wrapperType")],
  ["wrapElement", "Wraps an element in a new container-style element.", p("elementId", "wrapperType")],
  ["executeBatchActions", "Runs several tool calls as one undoable batch.", p("actions")],
  ["composeSection", "Builds a complete, fully styled section in one call.", p("name", "section", "children")],
  ["moveElement", "Moves an element next to or inside another node.", p("elementId", "targetId", "position")],
];

for (const [name, description, parameters] of TOOLS) {
  toolRegistry.registerTool({ name, description, parameters, execute: () => ({}) });
}

const names = (prompt) => selectTools(prompt).map((tool) => tool.name);

// --- the core set is always present, so the model can always orient ---
for (const prompt of ["make the heading blue", "", "asdfghjkl"]) {
  for (const core of CORE_TOOL_NAMES) {
    assert.ok(names(prompt).includes(core), `core tool ${core} missing for prompt "${prompt}"`);
  }
}

// --- relevant tools surface for their own vocabulary ---
assert.ok(names("change the heading font size and weight").includes("updateTypography"));
assert.ok(names("make the background colour dark blue").includes("updateColors"));
assert.ok(names("add more padding around the section").includes("updateSpacing"));
assert.ok(names("delete the sponsors section").includes("deleteSection"));
assert.ok(names("translate this into Spanish").includes("translateContent"));
assert.ok(names("change the hero heading to Secure AI Hackathon Studio").includes("setContent"));
assert.ok(names("check the site for accessibility problems").includes("analyzeAccessibility"));
assert.ok(names("save this as a template").includes("saveTemplate"));
assert.ok(names("group these elements into a container").includes("groupElements"));

// --- plurals and spelling variants still match ---
assert.ok(names("fix the colours on mobile").includes("updateColors"), "colours -> color");
assert.ok(names("duplicate two sections").includes("duplicateSection"), "sections -> section");
assert.ok(names("hide it on mobile breakpoints").includes("toggleResponsiveVisibility"));

// --- the whole point: the list stays small ---
// 20, not 18: the core set now carries the styling tools (updateColors /
// Typography / Spacing) because a created section that is never styled is the
// main quality failure, and keyword scoring never surfaces them for "add a hero".
for (const prompt of ["make the heading blue", "audit the page and fix everything", "change section colours and spacing"]) {
  assert.ok(selectTools(prompt).length <= 20, `too many tools for "${prompt}": ${selectTools(prompt).length}`);
}
assert.ok(selectTools("make the heading blue").length < TOOLS.length, "must not send the whole registry");

// --- irrelevant tools are excluded, not merely deprioritised ---
const forHeading = names("change the heading font size");
assert.ok(!forHeading.includes("uploadAsset"));
assert.ok(!forHeading.includes("saveTemplate"));

// --- anything excluded is still discoverable, so nothing is truly lost ---
assert.ok(searchToolIndex("upload an image asset").some((t) => t.name === "uploadAsset"));
assert.ok(searchToolIndex("merge sections together").some((t) => t.name === "mergeSections"));
assert.equal(searchToolIndex("zzzz nonexistent").length, 0);
assert.ok(searchToolIndex("colour", 3).length <= 3, "limit is respected");
assert.ok(searchToolIndex("theme")[0].parameters, "discoverTools must return callable schemas");

/* --- regression: an invented tool name must find the right tool ---
   Reported: callTool("changeFontFamily") suggested changeElementType,
   changeTone, validateChanges, rollbackChanges -- all wrong, because the
   camelCase name was never split and "change" outweighed "font family". */
const invented = searchToolIndex("changeFontFamily", 5, ["componentId", "fontFamily"]);
assert.equal(invented[0].name, "updateTypography", `expected updateTypography, got ${invented[0]?.name}`);
assert.ok(
  invented[0].score >= (invented[1]?.score ?? 0) * 2,
  "the right tool must win decisively enough for callTool to auto-recover",
);
assert.ok(!invented.slice(0, 2).some((t) => t.name === "changeElementType"), "verb-only matches must not rank first");

// the same must hold for other invented names a model might reach for
assert.equal(searchToolIndex("setBackgroundColor", 3, ["backgroundColor"])[0].name, "updateColors");
assert.equal(searchToolIndex("changePadding", 3, ["padding"])[0].name, "updateSpacing");
assert.equal(searchToolIndex("makeItDarkMode", 3, [])[0].name, "switchColorScheme");

// camelCase splitting works in plain prompts too
assert.ok(names("changeFontFamily on the title").includes("updateTypography"));

console.log("ToolRouter: all checks passed");

/* --- regression: "add a heading" must reach createElement ---
   The word "heading" lives only in createElement's `type` enum, so before enum
   values were indexed the model was offered createSection/createPage/
   findComponent and had no way to create the heading it was asked for. */
toolRegistry.registerTool({
  name: "createElement",
  // Verbatim from elementTools.js -- a stub with a shorter description would
  // test ranking that does not exist in production.
  description:
    "Creates an element and places it relative to an existing node (inside a container, or before/after a " +
    "sibling). For bullet points use type 'list' with props.items as an array of strings -- one list element, " +
    "not one element per bullet.",
  parameters: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["heading", "paragraph", "button", "image", "list", "container", "card"] },
      targetId: { type: "string" }, position: { type: "string" }, props: { type: "object" },
    },
  },
  execute: () => ({}),
});
toolRegistry.registerTool({
  name: "createPage",
  description: "Adds a new page to the site and opens it.",
  parameters: { type: "object", properties: { name: { type: "string" }, path: { type: "string" } } },
  execute: () => ({}),
});

const reported = names("In this new section add a page title heading Problem Statement");
assert.ok(reported.includes("createElement"), `createElement missing from: ${reported.join(", ")}`);
assert.ok(reported.includes("createSection"), "the section tool is still offered");

// other type words from the enums route too
assert.ok(names("add three bullet points").includes("createElement"), "'bullet points' -> list -> createElement");
assert.ok(names("put a card here").includes("createElement"));
assert.ok(names("add a blank section").includes("createSection"), "'blank' comes from createSection's enum");

console.log("ToolRouter enum routing: all checks passed");
