import assert from "node:assert/strict";

// zustand/persist needs a storage. Suites share a process and the store module
// is cached, so persist binds to whichever shim is installed first.
if (!globalThis.localStorage) {
  const backing = new Map();
  globalThis.localStorage = {
    getItem: (key) => (backing.has(key) ? backing.get(key) : null),
    setItem: (key, value) => backing.set(key, String(value)),
    removeItem: (key) => backing.delete(key),
  };
}

const { composeSection } = await import("./composeTools.js");
const { useEditorStore } = await import("@/store/editorStore");

const reset = () => useEditorStore.setState({ components: [], selectedIds: [], history: [], future: [] });
const context = { getState: () => useEditorStore.getState() };
const run = (args) => composeSection.execute(args, context); // async: always await

const HERO = {
  name: "hero",
  section: { background: "linear-gradient(135deg, #2B0A5A 0%, #6D28D9 100%)", paddingTop: 128 },
  children: [{
    type: "container",
    styles: { display: "flex", flexDirection: "column", gap: "24px" },
    children: [
      { type: "badge", text: "MARCH 14–16", styles: { fontSize: "12px" } },
      { type: "heading", text: "Build the future in 48 hours.", styles: { fontSize: "72px", color: "#FFFFFF" } },
      { type: "row", children: [{ type: "button", text: "Claim your spot" }] },
    ],
  }],
};

// --- the whole point: one call yields a styled, populated tree ---
reset();
const result = await run(HERO);
assert.ok(result.success !== false, `compose failed: ${JSON.stringify(result)}`);

const [sectionNode] = useEditorStore.getState().components;
assert.equal(sectionNode.type, "blank");
assert.match(sectionNode.props.background, /linear-gradient/, "gradient reaches the shell");
assert.equal(sectionNode.props.paddingTop, 128);

// Content must land INSIDE the preset's container, not beside it, or it renders
// full-bleed next to an empty wrapper.
assert.equal(sectionNode.children.length, 1, "no stray sibling wrapper");
const container = sectionNode.children[0];
assert.equal(container.type, "container");
// A lone container spec merges into the preset's wrapper instead of nesting a
// second one inside it.
assert.equal(container.children.length, 3, "all children placed inside the container");
assert.equal(container.styles.flexDirection, "column", "the spec container's styles are kept on merge");
assert.ok(!container.children.some((c) => c.type === "container"), "no redundant nested container");

const [badge, heading, row] = container.children;
assert.equal(heading.props.text, "Build the future in 48 hours.", "copy applied");
assert.equal(heading.styles.fontSize, "72px", "styles applied");
assert.equal(badge.styles.fontSize, "12px");

// Buttons carry their label under a different prop than every other element.
assert.equal(row.children[0].props.label, "Claim your spot", "button text -> props.label");

// Every node needs a real id or selection and later edits cannot target it.
const ids = [];
(function walk(n) { ids.push(n.id); (n.children || []).forEach(walk); })(sectionNode);
assert.ok(ids.every(Boolean), "every node has an id");
assert.equal(new Set(ids).size, ids.length, "ids are unique");

// --- failures are loud, because a silently-skipped type renders as nothing ---
reset();
assert.match((await run({ children: [{ type: "carousel", text: "x" }] })).error, /Unknown element type/);
assert.match((await run({ children: [{ text: "no type" }] })).error, /needs a 'type'/);
assert.match((await run({ children: [] })).error, /non-empty/);
assert.equal(useEditorStore.getState().components.length, 0, "nothing added on failure");

// --- runaway specs are capped ---
reset();
let deep = { type: "container" };
for (let i = 0; i < 9; i++) deep = { type: "container", children: [deep] };
assert.match((await run({ children: [deep] })).error, /Nesting deeper/);

reset();
assert.match(
  (await run({ children: Array.from({ length: 61 }, () => ({ type: "paragraph", text: "x" })) })).error,
  /may not exceed/,
);

// --- index places the section rather than always appending ---
reset();
await run({ name: "a", children: [{ type: "paragraph", text: "first" }] });
await run({ name: "b", children: [{ type: "paragraph", text: "second" }], index: 0 });
const order = useEditorStore.getState().components;
assert.equal(order.length, 2);
assert.equal(order[0].children[0].children[0].props.text, "second", "index inserts at the front");

reset();
console.log("composeTools: all checks passed");
