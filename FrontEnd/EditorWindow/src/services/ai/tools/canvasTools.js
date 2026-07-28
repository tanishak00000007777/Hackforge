import { defineTool, ok, fail } from "./defineTool";
import { editorAdapter } from "../EditorAdapter";
import { DEVICES } from "@/builder/responsive/ResponsiveEngine";

const VIEWPORTS = Object.keys(DEVICES);
const ZOOM_MIN = 25;
const ZOOM_MAX = 200;

export const getCanvasState = defineTool({
  name: "getCanvasState",
  description: "Returns the current viewport, zoom, pan, selection, theme mode and history depth.",
  execute: (_args, context) => {
    const state = context.getState();
    return ok({
      viewport: state.device,
      zoom: state.zoom,
      pan: state.pan,
      previewMode: state.isPreviewMode,
      selectedIds: state.selectedIds,
      themeMode: state.globalTheme?.mode || "light",
      sectionCount: state.components.length,
      canUndo: state.history.length > 0,
      canRedo: state.future.length > 0,
      historyDepth: state.history.length,
    });
  },
});

export const captureCanvasSnapshot = defineTool({
  name: "captureCanvasSnapshot",
  description: "Captures the full page tree and theme as structured data. Use before a risky change so it can be described or restored.",
  parameters: {
    type: "object",
    properties: { includeStyles: { type: "boolean", description: "Include per-node styles (default true)." } },
  },
  execute: ({ includeStyles = true }, context) => {
    const state = context.getState();
    const shape = (node) => ({
      id: node.id,
      type: node.type,
      props: node.props || {},
      styles: includeStyles ? node.styles || {} : undefined,
      hidden: !!node.hidden,
      children: (node.children || []).map(shape),
    });
    return ok({
      capturedAt: new Date().toISOString(),
      viewport: state.device,
      historyDepth: state.history.length,
      theme: state.globalTheme,
      tree: state.components.map(shape),
    });
  },
});

export const setViewport = defineTool({
  name: "setViewport",
  description: "Switches the canvas viewport between desktop, tablet and mobile.",
  parameters: {
    type: "object",
    properties: { viewport: { type: "string", enum: VIEWPORTS, description: "desktop | tablet | mobile" } },
    required: ["viewport"],
  },
  execute: ({ viewport }, context) => {
    if (!VIEWPORTS.includes(viewport)) {
      return fail(`Unknown viewport '${viewport}'. Expected one of: ${VIEWPORTS.join(", ")}.`);
    }
    editorAdapter.setDevice(viewport);
    return ok({ viewport: context.getState().device });
  },
});

export const zoomCanvas = defineTool({
  name: "zoomCanvas",
  description: "Sets the canvas zoom level as a percentage (25-200).",
  parameters: {
    type: "object",
    properties: { zoom: { type: "number", description: "Zoom percentage between 25 and 200." } },
    required: ["zoom"],
  },
  execute: ({ zoom }, context) => {
    const value = Number(zoom);
    if (!Number.isFinite(value)) return fail(`'${zoom}' is not a number.`);
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value)));
    editorAdapter.setZoom(clamped);
    return ok({ zoom: clamped, clamped: clamped !== Math.round(value) });
  },
});

export const panCanvas = defineTool({
  name: "panCanvas",
  description: "Pans the canvas to an absolute position, or by a relative offset.",
  parameters: {
    type: "object",
    properties: {
      x: { type: "number", description: "Horizontal position or offset in pixels." },
      y: { type: "number", description: "Vertical position or offset in pixels." },
      relative: { type: "boolean", description: "Treat x/y as an offset from the current pan." },
    },
  },
  execute: ({ x = 0, y = 0, relative = false }, context) => {
    const current = context.getState().pan;
    const next = relative ? { x: current.x + Number(x), y: current.y + Number(y) } : { x: Number(x), y: Number(y) };
    if (!Number.isFinite(next.x) || !Number.isFinite(next.y)) return fail("x and y must be numbers.");
    editorAdapter.setPan(next);
    return ok({ pan: next });
  },
});

export const undoAction = defineTool({
  name: "undoAction",
  description: "Undoes the last editor change.",
  execute: (_args, context) => {
    if (context.getState().history.length === 0) return fail("Nothing to undo.");
    editorAdapter.undo();
    return ok({ historyDepth: context.getState().history.length });
  },
});

export const redoAction = defineTool({
  name: "redoAction",
  description: "Redoes the last undone editor change.",
  execute: (_args, context) => {
    if (context.getState().future.length === 0) return fail("Nothing to redo.");
    editorAdapter.redo();
    return ok({ historyDepth: context.getState().history.length });
  },
});

export const canvasTools = [
  getCanvasState, captureCanvasSnapshot, setViewport, zoomCanvas, panCanvas, undoAction, redoAction,
];
