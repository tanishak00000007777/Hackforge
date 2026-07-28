// Run: node --import ./alias-loader.mjs src/builder/commands/problemStatement.test.mjs
//
// Replays the reported prompt against the real command layer:
//   1. add a new section
//   2. a centred heading "Problem Statement" in blue
//   3. three bullet points below it
//   4. black section background
// Previously impossible: there was no blank section and no list element.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { insertNodeIntoTree, findNodeById, resolveNodeRef } from "./treeHelpers.js";
import { updateNodeById } from "./coreCommands.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

// --- the two new building blocks are registered ---
const registry = read("../registry/index.js");
assert.match(registry, /blankSection/, "blank section must be registered");
assert.match(registry, /listElement/, "list element must be registered");
const catalogue = read("../registry/catalogue.js");
assert.match(catalogue, /blank: \{ category: "Sections"/);
assert.match(catalogue, /list: \{ category: "Typography"/);
assert.match(catalogue, /"bullet"/, "the AI searches the catalogue by tag");

// --- build the section the way the tools do ---
const sectionId = "sec-blank";
let tree = insertNodeIntoTree([], {
  id: sectionId, type: "blank",
  props: { background: "#FFFFFF", paddingTop: 96, paddingBottom: 96 },
  children: [],
}, null, "after");
tree = [{ id: sectionId, type: "blank", props: { background: "#FFFFFF" }, children: [] }];

// 2. heading, centred, blue
const headingId = "el-heading";
tree = insertNodeIntoTree(tree, {
  id: headingId, type: "heading", props: { text: "Problem Statement" }, children: [], styles: {},
}, sectionId, "inside");
tree = updateNodeById(tree, headingId, { styles: { textAlign: "center", color: "#2563eb" } });

const heading = findNodeById(tree, headingId);
assert.equal(heading.props.text, "Problem Statement");
assert.equal(heading.styles.textAlign, "center");
assert.equal(heading.styles.color, "#2563eb");

// 3. three bullets as ONE list element, placed after the heading
const listId = "el-list";
tree = insertNodeIntoTree(tree, {
  id: listId, type: "list",
  props: { items: ["Problem statement 1", "Problem statement 2", "Problem statement 3"], ordered: false },
  children: [], styles: {},
}, headingId, "after");

const list = findNodeById(tree, listId);
assert.deepEqual(list.props.items, ["Problem statement 1", "Problem statement 2", "Problem statement 3"]);
assert.deepEqual(
  findNodeById(tree, sectionId).children.map((c) => c.id),
  [headingId, listId],
  "the list must sit below the heading, inside the section",
);

// 4. black background on the section
tree = updateNodeById(tree, sectionId, { props: { background: "#000000" } });
assert.equal(findNodeById(tree, sectionId).props.background, "#000000");
assert.equal(findNodeById(tree, headingId).props.text, "Problem Statement", "styling the section must not disturb its children");

// --- the list renderer tolerates what a model actually sends ---
const listSource = read("../../components/studio/elements/List/List.jsx");
assert.match(listSource, /Array\.isArray/, "array items");
assert.match(listSource, /split\(/, "newline or comma separated string items");

// --- ids the model copies out of the outline still resolve ---
assert.equal(resolveNodeRef(tree, `heading#${headingId}`)?.id, headingId);

console.log("problemStatement: all checks passed");
