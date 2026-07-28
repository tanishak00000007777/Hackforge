import { defineTool, ok, fail } from "./defineTool";
import { useEditorStore, normalizePath } from "@/store/editorStore";

const store = () => useEditorStore.getState();

const describe = (page, currentPageId) => ({
  id: page.id,
  name: page.name,
  path: page.path,
  sectionCount: (page.components || []).length,
  isCurrent: page.id === currentPageId,
});

/** Accepts a page id, a name, or a path -- models use whichever they have. */
function findPage(ref) {
  const { pages } = store();
  const needle = String(ref || "").trim().toLowerCase();
  return (
    pages.find((page) => page.id === ref) ||
    pages.find((page) => page.path === normalizePath(needle)) ||
    pages.find((page) => page.name.toLowerCase() === needle) ||
    null
  );
}

export const listPages = defineTool({
  name: "listPages",
  description: "Lists every page in the site with its name, path and section count, and says which one is open.",
  execute: () => {
    const state = store();
    return ok({
      currentPageId: state.currentPageId,
      pageCount: state.pages.length,
      pages: state.getPages().map((page) => describe(page, state.currentPageId)),
    });
  },
});

export const createPage = defineTool({
  name: "createPage",
  description: "Adds a new page to the site and opens it. The new page starts with one blank section.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Page name, e.g. 'About'." },
      path: { type: "string", description: "URL path. Derived from the name when omitted." },
    },
    required: ["name"],
  },
  execute: ({ name, path }) => {
    if (!String(name).trim()) return fail("A page needs a name.");

    const wanted = normalizePath(path || name);
    if (store().pages.some((page) => page.path === wanted)) {
      return fail(`A page already exists at '${wanted}'. Pick a different name or path.`);
    }

    const before = new Set(store().pages.map((page) => page.id));
    store().addPage(name, path);
    const created = store().pages.find((page) => !before.has(page.id));
    if (!created) return fail("The page could not be created.");

    return ok({ page: describe(created, store().currentPageId), opened: true });
  },
});

export const switchPage = defineTool({
  name: "switchPage",
  description: "Opens another page on the canvas so later edits apply to it. Undo history restarts, since it belongs to the page you left.",
  parameters: {
    type: "object",
    properties: { page: { type: "string", description: "Page id, name or path." } },
    required: ["page"],
  },
  execute: ({ page }) => {
    const target = findPage(page);
    if (!target) {
      return fail(`No page called '${page}'. Available: ${store().pages.map((p) => `${p.name} (${p.path})`).join(", ")}.`);
    }
    if (target.id === store().currentPageId) {
      return ok({ page: describe(target, store().currentPageId), alreadyOpen: true });
    }

    store().switchPage(target.id);
    return ok({ page: describe(target, store().currentPageId), opened: true });
  },
});

export const deletePage = defineTool({
  name: "deletePage",
  description: "Deletes a page and everything on it. A site must keep at least one page.",
  parameters: {
    type: "object",
    properties: { page: { type: "string", description: "Page id, name or path." } },
    required: ["page"],
  },
  execute: ({ page }) => {
    const target = findPage(page);
    if (!target) return fail(`No page called '${page}'.`);
    if (store().pages.length <= 1) return fail("This is the only page; a site must have at least one.");

    const wasCurrent = target.id === store().currentPageId;
    store().deletePage(target.id);
    return ok({ deleted: { id: target.id, name: target.name, path: target.path }, remaining: store().pages.length, switched: wasCurrent });
  },
});

export const renamePage = defineTool({
  name: "renamePage",
  description: "Changes a page's name and/or URL path.",
  parameters: {
    type: "object",
    properties: {
      page: { type: "string", description: "Page id, name or path." },
      name: { type: "string", description: "New name." },
      path: { type: "string", description: "New URL path." },
    },
    required: ["page"],
  },
  execute: ({ page, name, path }) => {
    const target = findPage(page);
    if (!target) return fail(`No page called '${page}'.`);
    if (name === undefined && path === undefined) return fail("Provide a new name, a new path, or both.");

    if (path !== undefined) {
      const wanted = normalizePath(path);
      if (store().pages.some((other) => other.path === wanted && other.id !== target.id)) {
        return fail(`Another page already uses '${wanted}'.`);
      }
    }

    const before = { name: target.name, path: target.path };
    store().renamePage(target.id, { name, path });
    const after = store().pages.find((p) => p.id === target.id);
    return ok({ before, after: { name: after.name, path: after.path } });
  },
});

export const duplicatePage = defineTool({
  name: "duplicatePage",
  description: "Copies a page, with all its sections, to a new path.",
  parameters: {
    type: "object",
    properties: { page: { type: "string", description: "Page id, name or path." } },
    required: ["page"],
  },
  execute: ({ page }) => {
    const target = findPage(page);
    if (!target) return fail(`No page called '${page}'.`);

    const before = new Set(store().pages.map((p) => p.id));
    store().duplicatePage(target.id);
    const copy = store().pages.find((p) => !before.has(p.id));
    if (!copy) return fail("The page could not be duplicated.");

    return ok({ source: { name: target.name, path: target.path }, copy: describe(copy, store().currentPageId) });
  },
});

export const pageTools = [listPages, createPage, switchPage, deletePage, renamePage, duplicatePage];
