import assert from "node:assert/strict";

if (!globalThis.localStorage) {
  const backing = new Map();
  globalThis.localStorage = {
    getItem: (k) => (backing.has(k) ? backing.get(k) : null),
    setItem: (k, v) => backing.set(k, String(v)),
    removeItem: (k) => backing.delete(k),
  };
}

const { applyTheme, generateTheme } = await import("./themeTools.js");
const { useEditorStore } = await import("@/store/editorStore");

const context = { getState: () => useEditorStore.getState() };
const CUSTOM = "#ff00aa"; // a colour no palette produces

function seedPage() {
  useEditorStore.setState({
    components: [
      { id: "s1", type: "hero", props: { background: "#FFFFFF" }, styles: {}, children: [
        { id: "h1", type: "heading", props: { text: "Hi", color: "#171C5A" }, styles: {}, children: [] },
        { id: "b1", type: "button", props: { label: "Go", background: "#2B0A5A" }, styles: {}, children: [] },
        { id: "c1", type: "paragraph", props: { text: "custom" }, styles: { color: CUSTOM }, children: [] },
      ] },
      { id: "s2", type: "footer", props: { background: "#0F172A" }, styles: {}, children: [] },
    ],
    selectedIds: [], history: [], future: [],
  });
}

const find = (id) => {
  let hit = null;
  (function walk(nodes) {
    for (const n of nodes || []) { if (n.id === id) hit = n; walk(n.children); }
  })(useEditorStore.getState().components);
  return hit;
};

// --- the bug: writing tokens alone left the page looking identical ---
seedPage();
const before = JSON.stringify(useEditorStore.getState().components);
const res = await applyTheme.execute({ preset: "slate" }, context);
assert.notEqual(res.success, false, `applyTheme failed: ${res.error}`);
assert.ok(res.data.repaintedNodes > 0, "a theme change must repaint existing nodes");
assert.notEqual(JSON.stringify(useEditorStore.getState().components), before, "page did not change");

// Section backgrounds move to the new palette.
const hero = find("s1");
assert.notEqual(hero.props.background.toLowerCase(), "#ffffff", "hero background repainted");

// A dark band stays dark rather than turning into the light surface.
const footer = find("s2");
assert.notEqual(footer.props.background.toLowerCase(), "#0f172a", "footer repainted");
assert.notEqual(footer.props.background.toLowerCase(), hero.props.background.toLowerCase(),
  "footer must not collapse to the same colour as the hero");

// --- colours the user chose are not theme colours, so they survive ---
assert.equal(find("c1").styles.color, CUSTOM, "custom colour must not be repainted");

// --- repainting is idempotent: applying the same preset twice changes nothing ---
const afterFirst = JSON.stringify(useEditorStore.getState().components);
await applyTheme.execute({ preset: "slate" }, context);
assert.equal(JSON.stringify(useEditorStore.getState().components), afterFirst,
  "re-applying the same preset must be a no-op");

// --- the repaint must be undoable; the UI offers "Undo this" ---
seedPage();
const original = JSON.stringify(useEditorStore.getState().components);
await applyTheme.execute({ preset: "forest" }, context);
assert.notEqual(JSON.stringify(useEditorStore.getState().components), original, "forest repainted");
useEditorStore.getState().undo();
assert.equal(JSON.stringify(useEditorStore.getState().components), original,
  "undo must restore the pre-theme colours");

// --- an unknown preset fails instead of silently doing nothing ---
assert.match((await applyTheme.execute({ preset: "not-a-preset" }, context)).error, /Unknown preset/);

// --- natural colour names from chat are accepted, not only model-normalized hex ---
seedPage();
const red = await generateTheme.execute({ baseColor: "red" }, context);
assert.equal(red.success, true);
assert.equal(red.data.colors.primary, "#DC2626");

useEditorStore.setState({ components: [], selectedIds: [], history: [], future: [] });
console.log("themeTools: all checks passed");
