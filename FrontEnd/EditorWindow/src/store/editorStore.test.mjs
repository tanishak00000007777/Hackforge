// Run: node --import ./alias-loader.mjs src/store/editorStore.test.mjs
//
// Covers the three store defects: nothing survived a reload, history grew
// without limit, and undo left the Inspector pointing at a dead node.
import assert from "node:assert/strict";

// zustand/persist needs a storage; the registry pulls in JSX, so the store is
// exercised through its own module with a minimal localStorage shim.
// Suites share a process and the store module is cached, so persist binds to
// whichever shim is installed first.
if (!globalThis.localStorage) {
  const backing = new Map();
  globalThis.localStorage = {
    getItem: (key) => (backing.has(key) ? backing.get(key) : null),
    setItem: (key, value) => backing.set(key, String(value)),
    removeItem: (key) => backing.delete(key),
  };
}
const readSaved = () => JSON.parse(globalThis.localStorage.getItem("hackforge-studio-project:draft")).state;

const { useEditorStore, MAX_HISTORY, createProjectSnapshot } = await import("./editorStore.js");
const api = () => useEditorStore.getState();

const node = (id, extra = {}) => ({ id, type: "paragraph", props: { text: id }, styles: {}, children: [], ...extra });

// --- history is bounded: every entry deep-clones the tree ---
useEditorStore.setState({ components: [node("a")], history: [], future: [], selectedIds: [] });
for (let i = 0; i < MAX_HISTORY + 20; i++) api().updateNode("a", { props: { text: `v${i}` } });
assert.equal(api().history.length, MAX_HISTORY, `history must cap at ${MAX_HISTORY}`);
assert.equal(api().components[0].props.text, `v${MAX_HISTORY + 19}`, "latest edit still applied");

// --- undo restores the selection that belonged to that state ---
useEditorStore.setState({ components: [node("a"), node("b")], history: [], future: [], selectedIds: ["b"] });
api().updateNode("a", { props: { text: "changed" } });
api().select("a");
api().undo();
assert.deepEqual(api().selectedIds, ["b"], "undo must restore the earlier selection");
assert.equal(api().components[0].props.text, "a", "undo must restore the tree");

api().redo();
assert.equal(api().components[0].props.text, "changed", "redo reapplies the edit");

// --- a selection pointing at a node the restored tree lacks is dropped ---
useEditorStore.setState({ components: [node("a")], history: [], future: [], selectedIds: [] });
api().addComponent(node("temp"));
api().select("temp");
api().undo();
assert.deepEqual(api().selectedIds, [], "selection of a node that no longer exists must be cleared");

// --- undo/redo at the boundaries is a no-op, not a crash ---
useEditorStore.setState({ components: [node("a")], history: [], future: [], selectedIds: [] });
api().undo();
api().redo();
assert.equal(api().components.length, 1);

// --- what persists, and what deliberately does not ---
const persisted = readSaved();
assert.ok(persisted.components, "the canvas must survive a reload");
assert.ok(persisted.globalTheme, "the theme must survive a reload");
assert.equal(persisted.history, undefined, "an undo stack from a previous session is not restored");
assert.equal(persisted.selectedIds, undefined, "selection is ephemeral");
assert.equal(persisted.zoom, undefined, "viewport state is ephemeral");

// --- blob: asset URLs are dead after a reload, so they are not saved ---
api().addAsset({ id: "1", name: "keep.png", type: "image", url: "https://cdn.example.com/keep.png" });
api().addAsset({ id: "2", name: "dead.png", type: "image", url: "blob:http://localhost/xyz" });
const savedAssets = readSaved().assets;
assert.deepEqual(savedAssets.map((a) => a.id), ["1"], "blob: URLs must not be persisted");

// --- resetProject returns a clean, usable single-page canvas ---
api().resetProject();
assert.ok(api().components.length > 0, "reset must leave a usable starting page");
assert.equal(api().pages.length, 1, "reset must not retain pages from another project");
assert.equal(api().history.length, 0, "history from the previous project must be discarded");

// --- the backend snapshot includes the live current-page tree ---
api().addComponent(node("live"));
const snapshot = createProjectSnapshot(api());
assert.equal(snapshot.schemaVersion, 1);
assert.ok(snapshot.pages[0].components.some((component) => component.id === "live"));

console.log("editorStore: all checks passed");
