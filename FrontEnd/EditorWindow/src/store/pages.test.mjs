// Run: npm test
// Multi-page: `components` stays the CURRENT page's tree, so every existing
// command and renderer keeps working unchanged.
import assert from "node:assert/strict";

// The store module is cached across suites, so persist binds to whichever
// shim was installed first. Reuse it rather than shadowing it.
if (!globalThis.localStorage) {
  const backing = new Map();
  globalThis.localStorage = {
    getItem: (key) => (backing.has(key) ? backing.get(key) : null),
    setItem: (key, value) => backing.set(key, String(value)),
    removeItem: (key) => backing.delete(key),
  };
}
const readSaved = () => JSON.parse(globalThis.localStorage.getItem("hackforge-studio-project:draft")).state;

const { useEditorStore, normalizePath, HOME_PAGE_ID } = await import("./editorStore.js");
const { buildStaticSite, fileNameForPath } = await import("../builder/utils/ProjectExporter.js");
const api = () => useEditorStore.getState();

const node = (id) => ({ id, type: "paragraph", props: { text: id }, styles: {}, children: [] });
const reset = () =>
  useEditorStore.setState({
    pages: [{ id: HOME_PAGE_ID, name: "Home", path: "/" }],
    currentPageId: HOME_PAGE_ID,
    components: [node("home-1")],
    history: [], future: [], selectedIds: [],
  });

// --- paths are slugified and always rooted ---
assert.equal(normalizePath("About Us"), "/about-us");
assert.equal(normalizePath("/Contact/"), "/contact");
assert.equal(normalizePath(""), "/");
assert.equal(normalizePath("Ünïcode & symbols!"), "/unicode-symbols", "accents fold to ASCII");
assert.equal(normalizePath("Café"), "/cafe");

// --- adding a page opens it, with its own tree ---
reset();
api().addPage("About");
assert.equal(api().pages.length, 2);
const about = api().pages.find((p) => p.path === "/about");
assert.equal(api().currentPageId, about.id, "a new page opens immediately");
assert.ok(api().components.length > 0, "a new page starts with a blank section, not an empty canvas");

// --- edits land on the open page only ---
api().addComponent(node("about-1"));
assert.ok(api().components.some((c) => c.id === "about-1"));

api().switchPage(HOME_PAGE_ID);
assert.deepEqual(api().components.map((c) => c.id), ["home-1"], "home is untouched by edits made on about");
assert.ok(!api().components.some((c) => c.id === "about-1"));

api().switchPage(about.id);
assert.ok(api().components.some((c) => c.id === "about-1"), "about kept its own edit");

// --- history does not leak across pages ---
api().switchPage(HOME_PAGE_ID);
api().addComponent(node("home-2"));
assert.equal(api().history.length, 1);
api().switchPage(about.id);
assert.equal(api().history.length, 0, "undo entries hold the previous page's tree and must be cleared");

// --- duplicate paths are refused ---
reset();
api().addPage("About");
const countBefore = api().pages.length;
api().addPage("About");
assert.equal(api().pages.length, countBefore, "a second page cannot take the same path");

// --- deleting the open page falls back to another; the last page is protected ---
reset();
api().addPage("Contact");
const contactId = api().currentPageId;
api().deletePage(contactId);
assert.equal(api().pages.length, 1);
assert.equal(api().currentPageId, HOME_PAGE_ID, "deleting the open page opens another one");
assert.deepEqual(api().components.map((c) => c.id), ["home-1"], "and loads that page's tree");

api().deletePage(HOME_PAGE_ID);
assert.equal(api().pages.length, 1, "the last page cannot be deleted");

// --- rename, including path collisions ---
reset();
api().addPage("About");
api().switchPage(HOME_PAGE_ID);
api().renamePage(HOME_PAGE_ID, { name: "Landing", path: "Landing" });
assert.equal(api().pages.find((p) => p.id === HOME_PAGE_ID).path, "/landing");
api().renamePage(HOME_PAGE_ID, { path: "/about" });
assert.equal(api().pages.find((p) => p.id === HOME_PAGE_ID).path, "/landing", "a taken path is refused");

// --- duplicate copies content to a fresh path with fresh ids ---
reset();
api().duplicatePage(HOME_PAGE_ID);
const copy = api().pages.find((p) => p.id !== HOME_PAGE_ID);
assert.ok(copy, "a copy exists");
assert.notEqual(copy.path, "/");
assert.equal(copy.components.length, 1);
assert.notEqual(copy.components[0].id, "home-1", "copies get fresh ids");

// --- getPages folds the live tree into the current page ---
reset();
api().addComponent(node("live"));
assert.ok(api().getPages()[0].components.some((c) => c.id === "live"));

// --- export writes one file per page, with cross-links ---
reset();
api().addPage("About");
api().switchPage(HOME_PAGE_ID);
const files = buildStaticSite(api().getPages(), api().globalTheme, { title: "Demo" });
assert.deepEqual(Object.keys(files).sort(), ["about.html", "index.html", "styles.css"]);
assert.ok(files["index.html"].includes('href="about.html"'), "pages link to each other");
assert.ok(files["index.html"].includes('aria-current="page"'), "the current page is marked");
assert.equal(fileNameForPath("/"), "index.html");
assert.equal(fileNameForPath("/about-us"), "about-us.html");

// --- a single-page site gets no nav chrome ---
reset();
const single = buildStaticSite(api().getPages(), api().globalTheme, {});
assert.ok(!single["index.html"].includes("site-nav"), "one page needs no navigation");

// --- pages survive a reload ---
reset();
api().addPage("Pricing");
api().addComponent(node("pricing-1"));
const saved = readSaved();
assert.equal(saved.pages.length, 2, "every page is persisted");
assert.ok(
  saved.pages.find((p) => p.path === "/pricing").components.some((c) => c.id === "pricing-1"),
  "the live tree is folded into its page before saving",
);

console.log("pages: all checks passed");
