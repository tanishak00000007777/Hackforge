// Run: node src/builder/commands/treeHelpers.test.mjs
import assert from "node:assert/strict";
import {
  findNodeById, findNodePath, findParentOf, mapNodeById, replaceNodeById,
  removeNodeById, wrapNode, unwrapNode, groupNodes, changeNodeType, moveNode,
} from "./treeHelpers.js";

const tree = () => [
  {
    id: "sec1", type: "hero", children: [
      { id: "h1", type: "heading", props: { text: "Hi" }, styles: { color: "red" } },
      { id: "p1", type: "paragraph", props: { text: "Body" } },
      { id: "box", type: "container", children: [{ id: "b1", type: "button", props: { text: "Go" } }] },
    ],
  },
  { id: "sec2", type: "footer", children: [] },
];

// --- lookup reaches any depth ---
assert.equal(findNodeById(tree(), "b1").type, "button");
assert.equal(findNodeById(tree(), "nope"), null);
assert.deepEqual(findNodePath(tree(), "b1").map((s) => s.id), ["sec1", "box", "b1"]);
assert.equal(findNodePath(tree(), "ghost"), null);
assert.equal(findParentOf(tree(), "b1").id, "box");
assert.equal(findParentOf(tree(), "sec1"), null, "root nodes have no parent");

// --- edits are immutable and depth-agnostic ---
const original = tree();
const edited = mapNodeById(original, "b1", (n) => ({ ...n, props: { text: "Changed" } }));
assert.equal(findNodeById(edited, "b1").props.text, "Changed");
assert.equal(findNodeById(original, "b1").props.text, "Go", "source tree must not be mutated");

assert.equal(findNodeById(removeNodeById(tree(), "box"), "b1"), null, "removing a parent removes its subtree");
assert.equal(findNodeById(replaceNodeById(tree(), "h1", { id: "h1", type: "badge" }), "h1").type, "badge");

// --- wrap / unwrap round-trip ---
const wrapped = wrapNode(tree(), "h1", { id: "w1", type: "container", children: [] });
assert.equal(findParentOf(wrapped, "h1").id, "w1");
assert.equal(findParentOf(unwrapNode(wrapped, "w1"), "h1").id, "sec1", "unwrap restores the original parent");
assert.equal(findNodeById(unwrapNode(wrapped, "w1"), "w1"), null);
assert.deepEqual(unwrapNode(tree(), "h1"), tree(), "unwrapping a childless node is a no-op");

// --- grouping keeps order and position ---
const grouped = groupNodes(tree(), ["h1", "p1"], { id: "g1", type: "container", children: [] });
assert.deepEqual(findNodeById(grouped, "g1").children.map((c) => c.id), ["h1", "p1"]);
assert.deepEqual(findNodeById(grouped, "sec1").children.map((c) => c.id), ["g1", "box"], "group sits where the first node was");
assert.deepEqual(groupNodes(tree(), ["h1", "ghost"], { id: "g", type: "container" }), tree(), "unknown id aborts the group");

// --- type change carries data over, keeps the id ---
const retyped = changeNodeType(tree(), "h1", { id: "fresh", type: "badge", props: { text: "default", variant: "solid" }, children: [] });
const badge = findNodeById(retyped, "h1");
assert.equal(badge.id, "h1", "id survives so selection and history stay valid");
assert.equal(badge.type, "badge");
assert.equal(badge.props.text, "Hi", "existing props win over the blank's defaults");
assert.equal(badge.props.variant, "solid", "new type's own defaults are kept");
assert.deepEqual(badge.styles, { color: "red" });

// --- move across containers ---
const moved = moveNode(tree(), "h1", "box", "inside");
assert.equal(findParentOf(moved, "h1").id, "box");
assert.equal(findNodeById(moved, "sec1").children.length, 2);

console.log("treeHelpers: all checks passed");
