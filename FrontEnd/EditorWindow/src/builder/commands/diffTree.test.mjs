// Run: npm test
import assert from "node:assert/strict";
import { diffTrees, describeDiff } from "./diffTree.js";

const base = () => [
  {
    id: "sec", type: "blank", props: { background: "#FFFFFF" }, styles: {}, children: [
      { id: "h", type: "heading", props: { text: "Old Title" }, styles: { color: "#111111" }, children: [] },
      { id: "p", type: "paragraph", props: { text: "Body" }, styles: {}, children: [] },
    ],
  },
];

// --- identical trees produce nothing to review ---
const same = diffTrees(base(), base());
assert.equal(same.changed, false);
assert.equal(same.summary, "no changes");
assert.deepEqual(describeDiff(same), []);

// --- a style change reports the exact field, old and new ---
const restyled = base();
restyled[0].children[0].styles.color = "#2563eb";
const styleDiff = diffTrees(base(), restyled);
assert.equal(styleDiff.changed, true);
assert.equal(styleDiff.modified.length, 1);
assert.deepEqual(styleDiff.modified[0].styles, [{ key: "color", from: "#111111", to: "#2563eb" }]);
assert.ok(describeDiff(styleDiff)[0].includes("#111111"));
assert.ok(describeDiff(styleDiff)[0].includes("#2563eb"));
assert.ok(describeDiff(styleDiff)[0].includes("Old Title"), "the line must name the element in plain terms");

// --- text edits are reported as prop changes ---
const retitled = base();
retitled[0].children[0].props.text = "New Title";
const textDiff = diffTrees(base(), retitled);
assert.deepEqual(textDiff.modified[0].props, [{ key: "text", from: "Old Title", to: "New Title" }]);

// --- additions and removals ---
const added = base();
added[0].children.push({ id: "l", type: "list", props: { items: ["a"] }, styles: {}, children: [] });
const addDiff = diffTrees(base(), added);
assert.equal(addDiff.added.length, 1);
assert.equal(addDiff.added[0].id, "l");
assert.equal(addDiff.added[0].parentId, "sec");
assert.ok(addDiff.modified.some((m) => m.id === "sec" && m.childrenReordered), "the parent's child list changed");

const removed = base();
removed[0].children.pop();
const removeDiff = diffTrees(base(), removed);
assert.equal(removeDiff.removed.length, 1);
assert.equal(removeDiff.removed[0].id, "p");
assert.ok(describeDiff(removeDiff).some((line) => line.startsWith("Removed")));

// --- reordering is detected even though nothing else changed ---
const reordered = base();
reordered[0].children.reverse();
const orderDiff = diffTrees(base(), reordered);
assert.equal(orderDiff.added.length, 0);
assert.equal(orderDiff.removed.length, 0);
assert.ok(orderDiff.modified.find((m) => m.id === "sec").childrenReordered);
assert.ok(describeDiff(orderDiff).some((line) => line.includes("children reordered")));

// --- visibility toggles surface as flags, not silent no-ops ---
const hiddenTree = base();
hiddenTree[0].hidden = true;
const hiddenDiff = diffTrees(base(), hiddenTree);
assert.deepEqual(hiddenDiff.modified[0].flags, [{ key: "hidden", from: false, to: true }]);

// --- responsive overrides count as a change ---
const responsive = base();
responsive[0].children[0].responsive = { mobile: { fontSize: "32px" } };
assert.equal(diffTrees(base(), responsive).modified.length, 1);

// --- summary counts every kind at once ---
const mixed = base();
mixed[0].children[0].props.text = "Changed";
mixed[0].children.pop();
mixed[0].children.push({ id: "n", type: "badge", props: { text: "New" }, styles: {}, children: [] });
const mixedDiff = diffTrees(base(), mixed);
assert.equal(mixedDiff.added.length, 1);
assert.equal(mixedDiff.removed.length, 1);
assert.ok(mixedDiff.summary.includes("added") && mixedDiff.summary.includes("removed"));

// --- the review list is capped so one turn cannot flood the panel ---
const many = [{ id: "s", type: "blank", props: {}, styles: {}, children: [] }];
const manyAfter = structuredClone(many);
for (let i = 0; i < 40; i++) manyAfter[0].children.push({ id: `x${i}`, type: "paragraph", props: {}, styles: {}, children: [] });
assert.ok(describeDiff(diffTrees(many, manyAfter)).length <= 12);

console.log("diffTree: all checks passed");

/* --- a new section arrives with its own children: one action, not many --- */
const sectionWithChildren = [
  ...base(),
  {
    id: "new-sec", type: "blank", props: {}, styles: [],
    children: [
      { id: "new-container", type: "container", props: {}, styles: {}, children: [
        { id: "new-inner", type: "paragraph", props: {}, styles: {}, children: [] },
      ] },
    ],
  },
];
const sectionDiff = diffTrees(base(), sectionWithChildren);
assert.equal(sectionDiff.added.length, 1, "only the outermost new node is reported");
assert.equal(sectionDiff.added[0].id, "new-sec");
assert.equal(sectionDiff.added[0].descendants, 2, "its subtree is counted, not listed");
assert.ok(describeDiff(sectionDiff)[0].includes("+2 inside"));
assert.ok(sectionDiff.summary.startsWith("1 added"), "the summary must not say 3 added");

// deleting a whole section is likewise one action
const deleted = diffTrees(sectionWithChildren, base());
assert.equal(deleted.removed.length, 1);
assert.equal(deleted.removed[0].id, "new-sec");
assert.equal(deleted.removed[0].descendants, 2);

// a leaf added into an existing parent still reports normally
const leaf = base();
leaf[0].children.push({ id: "solo", type: "badge", props: { text: "New" }, styles: {}, children: [] });
const leafDiff = diffTrees(base(), leaf);
assert.equal(leafDiff.added.length, 1);
assert.equal(leafDiff.added[0].descendants, undefined, "no subtree, no count");

console.log("diffTree collapsing: all checks passed");
