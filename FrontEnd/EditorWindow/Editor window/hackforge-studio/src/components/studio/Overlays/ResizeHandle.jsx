import React, { useState } from "react";
import { useEditorStore } from "@/store/editorStore";

const positions = {
  "top-left": "-top-1.5 -left-1.5 cursor-nwse-resize",
  "top": "-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize",
  "top-right": "-top-1.5 -right-1.5 cursor-nesw-resize",
  "right": "top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize",
  "bottom-right": "-bottom-1.5 -right-1.5 cursor-nwse-resize",
  "bottom": "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize",
  "bottom-left": "-bottom-1.5 -left-1.5 cursor-nesw-resize",
  "left": "top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize",
};

export default function ResizeHandle({ position, id }) {
  const [dragging, setDragging] = useState(false);
  const zoom = useEditorStore((state) => state.zoom);

  // In a full implementation, you would dispatch a startResize action,
  // track movement, and apply size delta to the specific node id in the store.
  // For now, we render the handles for the visual overlay.

  return (
    <div
      className={`absolute w-3 h-3 rounded-full bg-white border-2 border-violet-600 z-50 hover:bg-violet-100 ${positions[position]} pointer-events-auto`}
      onPointerDown={(e) => {
        e.stopPropagation();
        setDragging(true);
      }}
      onPointerUp={(e) => {
        setDragging(false);
      }}
    />
  );
}