import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as coreCommands from "@/builder/commands/coreCommands";
import * as coreFactory from "@/builder/factories/coreFactory";
import { unpinSections } from "@/builder/commands/stackDrop";
import { componentRegistry } from "@/builder/registry";
import { defaultTheme } from "@/builder/styles/theme";

/**
 * Each entry deep-clones the whole tree, so an unbounded stack grows without
 * limit across a long session. 50 steps is far more than anyone undoes.
 */
export const MAX_HISTORY = 50;

function createHistorySnapshot(state) {
  const history = [
    ...state.history,
    {
      components: structuredClone(state.components),
      globalTheme: structuredClone(state.globalTheme),
      // Undo that leaves the old selection behind points the Inspector at a
      // node that may no longer exist.
      selectedIds: [...state.selectedIds],
    },
  ];

  return {
    history: history.length > MAX_HISTORY ? history.slice(history.length - MAX_HISTORY) : history,
    future: [],
  };
}

export const HOME_PAGE_ID = "page-home";

/** "About Us" -> "/about-us", "Café" -> "/cafe", "" -> "/" */
export function normalizePath(value) {
  const slug = String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // fold accents rather than dropping the letter
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-z0-9/-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug ? `/${slug}` : "/";
}

/** blob: URLs are revoked when the tab closes, so persisting them stores dead links. */
const durableAssets = (assets = []) => assets.filter((asset) => !String(asset.url || "").startsWith("blob:"));

const createDefaultComponents = () => [
  coreFactory.createComponent("hero"),
  coreFactory.createComponent("tracks"),
].filter(Boolean);

const createDefaultPages = () => [{ id: HOME_PAGE_ID, name: "Home", path: "/" }];

/** Repair pages saved before sections stacked; see unpinSections. */
const restack = (components) => unpinSections(components, (type) => !!componentRegistry[type]);
const restackPages = (pages = []) =>
  pages.map((page) => (page.components ? { ...page, components: restack(page.components) } : page));

const scopedProjectStorage = {
  getItem(name) {
    const eventId = globalThis.sessionStorage?.getItem("hackforge_studio_event_id") || "draft";
    return localStorage.getItem(`${name}:${eventId}`);
  },
  setItem(name, value) {
    const eventId = globalThis.sessionStorage?.getItem("hackforge_studio_event_id") || "draft";
    localStorage.setItem(`${name}:${eventId}`, value);
  },
  removeItem(name) {
    const eventId = globalThis.sessionStorage?.getItem("hackforge_studio_event_id") || "draft";
    localStorage.removeItem(`${name}:${eventId}`);
  },
};

export function createProjectSnapshot(state) {
  return {
    schemaVersion: 1,
    components: state.components,
    pages: state.pages.map((page) =>
      page.id === state.currentPageId ? { ...page, components: state.components } : page,
    ),
    currentPageId: state.currentPageId,
    globalTheme: state.globalTheme,
    assets: durableAssets(state.assets),
    device: state.device,
  };
}

const createEditorStore = (set, get) => ({
  /* ============================================================
     EDITOR STATE
  ============================================================ */

  device: "desktop",

  globalTheme: defaultTheme,

  zoom: 100,

  draggedComponentId: null,

  dragOverComponentId: null,

  history: [],

  future: [],

  // View state
  isPreviewMode: false,

  /* ============================================================
     SIDEBAR STATE
  ============================================================ */
  sidebarTab: "Elements",
  sidebarSearch: "",
  sidebarFavorites: [],
  sidebarRecent: [],
  draggedSidebarComponent: null,

  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setSidebarSearch: (query) => set({ sidebarSearch: query }),
  toggleFavorite: (type) =>
    set((state) => {
      const isFav = state.sidebarFavorites.includes(type);
      return {
        sidebarFavorites: isFav
          ? state.sidebarFavorites.filter((t) => t !== type)
          : [...state.sidebarFavorites, type],
      };
    }),
  addRecent: (type) =>
    set((state) => ({
      sidebarRecent: [type, ...state.sidebarRecent.filter((t) => t !== type)].slice(0, 10),
    })),
  setDraggedSidebarComponent: (type) => set({ draggedSidebarComponent: type }),
  setPreviewMode: (val) => set({ isPreviewMode: val }),

  /* ============================================================
     COMPONENT TREE

     `components` is always the CURRENT page's tree. Every existing command,
     tool and renderer keeps working against it untouched; switching pages
     parks the live tree back into `pages` and loads the next one.
  ============================================================ */

  /* Deliberately empty, NOT createDefaultComponents().
     create() runs this initial state while the module is still being imported,
     and createComponent() needs componentRegistry from builder/registry --
     which is not initialised that early in the production bundle. Calling it
     here threw "Cannot read properties of undefined (reading 'hero')" and took
     the whole studio chunk down, leaving organizers a blank editor. Dev never
     showed it: Vite serves modules unbundled, in import order.
     Nothing is lost -- integrationStore.initialize() always follows with
     hydrateProject() or resetProject(), both of which build the defaults once
     the registry is ready. */
  components: [],

  /* ============================================================
     PAGES
  ============================================================ */

  pages: createDefaultPages(),
  currentPageId: HOME_PAGE_ID,

  /** Pages with the live tree folded into the current one. */
  getPages: () => {
    const state = get();
    return state.pages.map((page) =>
      page.id === state.currentPageId ? { ...page, components: state.components } : page,
    );
  },

  switchPage: (pageId) =>
    set((state) => {
      if (pageId === state.currentPageId) return state;
      const target = state.pages.find((page) => page.id === pageId);
      if (!target) return state;

      return {
        // Park the live tree back into the page being left.
        pages: state.pages.map((page) =>
          page.id === state.currentPageId ? { ...page, components: state.components } : page,
        ),
        currentPageId: pageId,
        components: target.components || [],
        selectedIds: [],
        // Undo entries hold trees from the page we just left; replaying them
        // onto a different page would corrupt it.
        history: [],
        future: [],
      };
    }),

  addPage: (name, path) =>
    set((state) => {
      const pageName = String(name || "").trim() || `Page ${state.pages.length + 1}`;
      const pagePath = normalizePath(path || pageName);
      if (state.pages.some((page) => page.path === pagePath)) return state;

      const page = {
        id: crypto.randomUUID(),
        name: pageName,
        path: pagePath,
        components: [coreFactory.createComponent("blank")].filter(Boolean),
      };

      return {
        pages: [
          ...state.pages.map((existing) =>
            existing.id === state.currentPageId ? { ...existing, components: state.components } : existing,
          ),
          page,
        ],
        currentPageId: page.id,
        components: page.components,
        selectedIds: [],
        history: [],
        future: [],
      };
    }),

  deletePage: (pageId) =>
    set((state) => {
      if (state.pages.length <= 1) return state; // a site always has one page
      const remaining = state.pages.filter((page) => page.id !== pageId);
      if (remaining.length === state.pages.length) return state;

      const leavingCurrent = pageId === state.currentPageId;
      const next = leavingCurrent ? remaining[0] : null;

      return {
        pages: remaining.map((page) =>
          page.id === state.currentPageId ? { ...page, components: state.components } : page,
        ),
        currentPageId: leavingCurrent ? next.id : state.currentPageId,
        components: leavingCurrent ? next.components || [] : state.components,
        selectedIds: leavingCurrent ? [] : state.selectedIds,
        history: leavingCurrent ? [] : state.history,
        future: leavingCurrent ? [] : state.future,
      };
    }),

  renamePage: (pageId, changes) =>
    set((state) => {
      const target = state.pages.find((page) => page.id === pageId);
      if (!target) return state;

      const path = changes.path === undefined ? target.path : normalizePath(changes.path);
      if (path !== target.path && state.pages.some((page) => page.path === path)) return state;

      return {
        pages: state.pages.map((page) =>
          page.id === pageId
            ? { ...page, name: String(changes.name ?? page.name).trim() || page.name, path }
            : page,
        ),
      };
    }),

  duplicatePage: (pageId) =>
    set((state) => {
      const pages = state.pages.map((page) =>
        page.id === state.currentPageId ? { ...page, components: state.components } : page,
      );
      const source = pages.find((page) => page.id === pageId);
      if (!source) return state;

      let path = normalizePath(`${source.path === "/" ? "home" : source.path}-copy`);
      let suffix = 2;
      while (pages.some((page) => page.path === path)) path = normalizePath(`${source.path}-copy-${suffix++}`);

      const copy = {
        id: crypto.randomUUID(),
        name: `${source.name} Copy`,
        path,
        components: (source.components || []).map((node) => coreFactory.duplicateNode(node)),
      };
      return { pages: [...pages, copy] };
    }),

  /* ============================================================
     SELECTION & PANNING
  ============================================================ */

  selectedIds: [],

  hoveredId: null,

  pan: { x: 0, y: 0 },

  isPanning: false,

  select: (id) =>
    set({
      selectedIds: id ? [id] : [],
    }),

  toggleSelection: (id) =>
    set((state) => {
      const isSelected = state.selectedIds.includes(id);
      return {
        selectedIds: isSelected
          ? state.selectedIds.filter((selId) => selId !== id)
          : [...state.selectedIds, id],
      };
    }),

  clearSelection: () =>
    set({
      selectedIds: [],
    }),

  hover: (id) =>
    set({
      hoveredId: id,
    }),

  setPan: (pan) =>
    set({
      pan,
    }),

  setIsPanning: (isPanning) =>
    set({
      isPanning,
    }),

  /* ============================================================
     DEVICE
  ============================================================ */

  setDevice: (device) =>
    set({
      device,
    }),

  /* ============================================================
     ZOOM
  ============================================================ */

  setZoom: (zoom) =>
    set({
      zoom,
    }),

  zoomIn: () =>
    set((state) => ({
      zoom: Math.min(state.zoom + 10, 200),
    })),

  zoomOut: () =>
    set((state) => ({
      zoom: Math.max(state.zoom - 10, 25),
    })),

  /* ============================================================
     UPDATE COMPONENT
  ============================================================ */

  // Resolve anywhere in the tree, not just the root list: canvas drag and the
  // inspector both hand us the id of whatever is selected, which is usually a
  // nested element. Root nodes still match, so this is a superset of the old
  // top-level-only behaviour.
  /**
   * Swap the whole tree in one undoable step. Used by page-wide rewrites such
   * as a theme repaint, which touch many nodes at once; going through
   * setState directly would skip the history snapshot and leave "Undo this"
   * unable to put the old colours back.
   */
  replaceComponents: (components) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components,
    })),

  updateComponent: (id, changes) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components: coreCommands.updateComponentProps(state.components, id, changes),
    })),

  updateComponentTransient: (id, changes) =>
    set((state) => ({
      components: coreCommands.updateComponentProps(state.components, id, changes),
    })),

  /* ============================================================
     COMPONENT MANAGEMENT
  ============================================================ */

  addComponent: (component) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components: coreCommands.insertComponent(state.components, component),
    })),

  /** Insert a section between two others, so a drop lands where it was aimed. */
  addComponentAt: (component, index) =>
    set((state) => {
      const components = [...state.components];
      components.splice(Math.max(0, Math.min(index, components.length)), 0, component);
      return { ...createHistorySnapshot(state), components };
    }),

  deleteComponent: (id) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components: coreCommands.removeComponent(state.components, id),
    })),

  duplicateComponent: (id) =>
    set((state) => {
      const components = coreCommands.duplicateComponent(state.components, id, coreFactory.duplicateNode);
      if (components === state.components) return state;

      return {
        ...createHistorySnapshot(state),
        components,
      };
    }),

  moveComponent: (fromIndex, toIndex) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components: coreCommands.moveComponent(state.components, fromIndex, toIndex),
    })),

  moveNode: (sourceId, targetId, position) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components: coreCommands.moveNode(state.components, sourceId, targetId, position),
    })),

  insertNode: (node, targetId, position) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components: coreCommands.insertNode(state.components, node, targetId, position),
    })),

  /* ============================================================
    ELEMENT API
    ============================================================ */
  
  addElement: (sectionId, element) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components: coreCommands.insertElement(state.components, sectionId, element),
    })),

  removeElement: (sectionId, elementId) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components: coreCommands.removeElement(state.components, sectionId, elementId),
    })),

  updateElement: (sectionId, elementId, changes) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components: coreCommands.updateElementProps(state.components, sectionId, elementId, changes),
    })),

  /* ============================================================
     TREE API (depth-agnostic)
     Same command layer as the section/element actions above, but
     addressed by node id alone -- what the AI tools work with.
  ============================================================ */

  updateNode: (id, changes) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components: coreCommands.updateNodeById(state.components, id, changes),
    })),

  deleteNode: (id) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components: coreCommands.removeNodeById(state.components, id),
    })),

  replaceNode: (id, node) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components: coreCommands.replaceNodeById(state.components, id, node),
    })),

  wrapNode: (id, wrapper) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components: coreCommands.wrapNode(state.components, id, wrapper),
    })),

  unwrapNode: (id) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components: coreCommands.unwrapNode(state.components, id),
    })),

  groupNodes: (ids, wrapper) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components: coreCommands.groupNodes(state.components, ids, wrapper),
    })),

  changeNodeType: (id, blank) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components: coreCommands.changeNodeType(state.components, id, blank),
    })),

  /* ============================================================
     HISTORY
  ============================================================ */

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previous = state.history[state.history.length - 1];
    return {
      history: state.history.slice(0, -1),
      future: [
        {
          components: structuredClone(state.components),
          globalTheme: structuredClone(state.globalTheme),
          selectedIds: [...state.selectedIds],
        },
        ...state.future,
      ],
      components: previous.components,
      globalTheme: previous.globalTheme,
      // Drop ids that the restored tree no longer contains.
      selectedIds: (previous.selectedIds || []).filter((id) => coreCommands.findNodeById(previous.components, id)),
    };
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    return {
      ...createHistorySnapshot(state),
      future: state.future.slice(1),
      components: next.components,
      globalTheme: next.globalTheme,
      selectedIds: (next.selectedIds || []).filter((id) => coreCommands.findNodeById(next.components, id)),
    };
  }),

  updateGlobalTheme: (changes) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      globalTheme: {
        ...state.globalTheme,
        ...changes
      },
    })),

  /* ============================================================
     ASSET MANAGEMENT
  ============================================================ */

  assets: [],
  draggedAsset: null,

  addAsset: (asset) =>
    set((state) => ({
      assets: [asset, ...state.assets],
    })),

  removeAsset: (id) =>
    set((state) => ({
      assets: state.assets.filter((a) => a.id !== id),
    })),

  setDraggedAsset: (asset) =>
    set({
      draggedAsset: asset,
    }),

  /* ============================================================
     TEMPLATES
  ============================================================ */

  /* User-saved templates only. The built-in defaults are static and live in
     builder/registry/templates -- read both together via listTemplates().
     They are deliberately NOT here: persist serialises this slice the moment
     the store is created, and building a default template needs
     componentRegistry, which is not initialised that early in the bundle.
     Doing it anyway threw "Cannot read properties of undefined (reading
     'hero')" and took the whole studio down with it. */
  savedTemplates: [],
  isTemplatesModalOpen: false,
  isCopilotOpen: false,
  isAIEditorOpen: false,

  setTemplatesModalOpen: (isOpen) =>
    set({
      isTemplatesModalOpen: isOpen,
    }),

  setCopilotOpen: (isOpen) =>
    set({
      isCopilotOpen: isOpen,
    }),

  /* Nodes the last AI turn touched. The canvas rings them and scrolls to the
     first one, so "it changed something, somewhere" becomes "it changed this".
     Deliberately not persisted -- it describes one turn, not the project. */
  aiChangedIds: [],

  setAIChangedIds: (ids) => set({ aiChangedIds: ids || [] }),

  setAIEditorOpen: (isOpen) =>
    set({
      isAIEditorOpen: isOpen,
    }),

  saveTemplate: (template) =>
    set((state) => ({
      savedTemplates: [template, ...state.savedTemplates],
    })),

  deleteTemplate: (id) =>
    set((state) => ({
      savedTemplates: state.savedTemplates.filter((t) => t.id !== id),
    })),

  loadProjectTemplate: (templateData) =>
    set((state) => ({
      ...createHistorySnapshot(state),
      components: templateData.components || [],
      globalTheme: templateData.globalTheme || state.globalTheme,
    })),

  /* ============================================================
     DRAGGING
  ============================================================ */

  startDragging: (id) =>
    set({
      draggedComponentId: id,
    }),

  stopDragging: () =>
    set({
      draggedComponentId: null,
      dragOverComponentId: null,
    }),

  setDragOver: (id) =>
    set({
      dragOverComponentId: id,
    }),

  /* ============================================================
     PROJECT LIFECYCLE
  ============================================================ */

  hydrateProject: (project) =>
    set((state) => {
      const pages = Array.isArray(project?.pages) && project.pages.length
        ? structuredClone(project.pages)
        : createDefaultPages();
      const currentPageId = pages.some((page) => page.id === project?.currentPageId)
        ? project.currentPageId
        : pages[0].id;
      const currentPage = pages.find((page) => page.id === currentPageId);
      const components = Array.isArray(currentPage?.components)
        ? currentPage.components
        : (Array.isArray(project?.components) ? structuredClone(project.components) : createDefaultComponents());

      return {
        components: restack(components),
        pages: restackPages(pages),
        currentPageId,
        globalTheme: project?.globalTheme || state.globalTheme,
        assets: Array.isArray(project?.assets) ? project.assets : [],
        device: ["desktop", "tablet", "mobile"].includes(project?.device) ? project.device : "desktop",
        selectedIds: [],
        history: [],
        future: [],
      };
    }),

  /** Discard the saved project and start clean. */
  resetProject: () =>
    set(() => ({
      components: createDefaultComponents(),
      pages: createDefaultPages(),
      currentPageId: HOME_PAGE_ID,
      globalTheme: defaultTheme,
      selectedIds: [],
      assets: [],
      device: "desktop",
      history: [],
      future: [],
    })),
});

/**
 * The canvas, theme, assets and saved templates survive a reload; ephemeral UI
 * state (selection, zoom, pan, drag, modals) deliberately does not, and neither
 * does history -- restoring an undo stack that refers to a previous session's
 * tree is worse than starting fresh.
 */
export const useEditorStore = create(
  persist(createEditorStore, {
    name: "hackforge-studio-project",
    version: 1,
    storage: createJSONStorage(() => scopedProjectStorage),
    partialize: (state) => ({
      components: state.components,
      // Save the live tree into its page, so no edit is lost on reload.
      pages: state.pages.map((page) =>
        page.id === state.currentPageId ? { ...page, components: state.components } : page,
      ),
      currentPageId: state.currentPageId,
      globalTheme: state.globalTheme,
      assets: durableAssets(state.assets),
      savedTemplates: state.savedTemplates,
      device: state.device,
    }),
    merge: (persisted, current) => {
      // A corrupted or empty save must not leave the editor with no canvas.
      const components = Array.isArray(persisted?.components) && persisted.components.length
        ? persisted.components
        : current.components;

      const pages = Array.isArray(persisted?.pages) && persisted.pages.length ? persisted.pages : current.pages;
      const currentPageId = pages.some((page) => page.id === persisted?.currentPageId)
        ? persisted.currentPageId
        : pages[0].id;

      return {
        ...current,
        ...persisted,
        pages: restackPages(pages),
        currentPageId,
        // Trust the page record over the loose `components` copy when they differ.
        components: restack(pages.find((page) => page.id === currentPageId)?.components || components),
        globalTheme: persisted?.globalTheme || current.globalTheme,
        history: [],
        future: [],
        selectedIds: [],
      };
    },
  }),
);
