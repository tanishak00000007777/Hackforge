import { create } from "zustand";
import * as coreCommands from "@/builder/commands/coreCommands";
import * as coreFactory from "@/builder/factories/coreFactory";
import { defaultTheme } from "@/builder/styles/theme";

function createHistorySnapshot(state) {
  return {
    history: [
      ...state.history,
      {
        components: structuredClone(state.components),
        globalTheme: structuredClone(state.globalTheme),
      },
    ],
    future: [],
  };
}

export const useEditorStore = create((set, get) => ({
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
  ============================================================ */

  components: [
    coreFactory.createComponent("hero"),
    coreFactory.createComponent("tracks"),
  ].filter(Boolean),

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
     HISTORY
  ============================================================ */

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previous = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);
    return {
      history: newHistory,
      future: [
        {
          components: structuredClone(state.components),
          globalTheme: structuredClone(state.globalTheme),
        },
        ...state.future,
      ],
      components: previous.components,
      globalTheme: previous.globalTheme,
    };
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    const newFuture = state.future.slice(1);
    return {
      ...createHistorySnapshot(state),
      future: newFuture,
      components: next.components,
      globalTheme: next.globalTheme,
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

  savedTemplates: [],
  isTemplatesModalOpen: false,
  isCopilotOpen: false,

  setTemplatesModalOpen: (isOpen) =>
    set({
      isTemplatesModalOpen: isOpen,
    }),

  setCopilotOpen: (isOpen) =>
    set({
      isCopilotOpen: isOpen,
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

}));