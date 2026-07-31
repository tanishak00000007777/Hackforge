import assert from "node:assert/strict";
import { moveComponent } from "./coreCommands.js";
import { dropIndex, reorderIndex, unpinSections } from "./stackDrop.js";

const page = () => [{ id: "a" }, { id: "b" }, { id: "c" }];
const order = (nodes) => nodes.map((node) => node.id).join("");

// --- new sections land in the gap that was previewed ---
assert.equal(dropIndex(page(), "a"), 0, "before the first section");
assert.equal(dropIndex(page(), "c"), 2, "before the last section");
assert.equal(dropIndex(page(), null), 3, "past the last section = append");
assert.equal(dropIndex(page(), "gone"), 3, "unknown id falls back to append");

// --- moving an existing section lands where the line was drawn ---
// Drag "a" down to the gap before "c": the page must read b, a, c.
const downwards = reorderIndex(0, dropIndex(page(), "c"));
assert.equal(order(moveComponent(page(), 0, downwards)), "bac", "drag down");

// Drag "c" up to the gap before "b": the page must read a, c, b.
const upwards = reorderIndex(2, dropIndex(page(), "b"));
assert.equal(order(moveComponent(page(), 2, upwards)), "acb", "drag up");

// Drag "a" to the very end: b, c, a.
const toEnd = reorderIndex(0, dropIndex(page(), null));
assert.equal(order(moveComponent(page(), 0, toEnd)), "bca", "drag to end");

// Dropping a section back into its own gap changes nothing.
assert.equal(reorderIndex(1, dropIndex(page(), "b")), null, "no-op drop");
assert.equal(reorderIndex(1, dropIndex(page(), "c")), null, "no-op drop, other side");

// --- repairing pages saved by the old drop-anywhere behaviour ---
const isSection = (type) => type === "hero" || type === "faq";
const saved = [
  { id: "1", type: "hero", styles: { position: "absolute", left: "475px", top: "1052px", zIndex: "10", background: "#fff" } },
  { id: "2", type: "faq", styles: { paddingTop: "96px" } },
  { id: "3", type: "button", styles: { position: "absolute", left: "20px", top: "40px" } },
];
const repaired = unpinSections(saved, isSection);

assert.deepEqual(
  repaired[0].styles,
  { background: "#fff" },
  "a pinned section returns to the flow, keeping its looks",
);
assert.equal(repaired[1], saved[1], "an untouched section is left alone");
assert.equal(repaired[2], saved[2], "a loose element keeps its coordinates");

console.log("stackDrop: ok");
