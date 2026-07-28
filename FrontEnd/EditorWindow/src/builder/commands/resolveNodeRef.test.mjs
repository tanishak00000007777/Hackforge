// Run: node src/builder/commands/resolveNodeRef.test.mjs
// Regression: the assistant passed "heading#8ff35bfa-9009-47e9-a164-9eca0df7bcc6"
// because the page outline printed the type glued to the id.
import assert from "node:assert/strict";
import { resolveNodeRef } from "./treeHelpers.js";

const ID = "8ff35bfa-9009-47e9-a164-9eca0df7bcc6";
const OTHER = "8ff35bfa-0000-0000-0000-000000000000"; // same 8-char prefix
const tree = [
  { id: "sec1", type: "hero", children: [{ id: ID, type: "heading", props: { text: "Hi" }, children: [] }] },
  { id: "sec2", type: "footer", children: [] },
];

// the exact reported failure
assert.equal(resolveNodeRef(tree, `heading#${ID}`)?.id, ID, "type#id must resolve");
assert.equal(resolveNodeRef(tree, ID)?.id, ID);

// other shapes a model produces
assert.equal(resolveNodeRef(tree, `#${ID}`)?.id, ID);
assert.equal(resolveNodeRef(tree, `  "${ID}"  `)?.id, ID, "quotes and whitespace");
assert.equal(resolveNodeRef(tree, "8ff35bfa")?.id, ID, "shortened id from the outline");
assert.equal(resolveNodeRef(tree, "heading#8ff35bfa")?.id, ID);

// ambiguity must fail rather than edit the wrong node
const ambiguous = [...tree, { id: OTHER, type: "paragraph", children: [] }];
assert.equal(resolveNodeRef(ambiguous, "8ff35bfa"), null, "an ambiguous prefix must not resolve");
assert.equal(resolveNodeRef(ambiguous, ID)?.id, ID, "an exact id still wins when prefixes collide");

// genuinely absent, and junk input
assert.equal(resolveNodeRef(tree, "nope-nope"), null);
assert.equal(resolveNodeRef(tree, "abc"), null, "too short to prefix-match safely");
assert.equal(resolveNodeRef(tree, ""), null);
assert.equal(resolveNodeRef(tree, null), null);
assert.equal(resolveNodeRef(null, ID), null);

console.log("resolveNodeRef: all checks passed");
