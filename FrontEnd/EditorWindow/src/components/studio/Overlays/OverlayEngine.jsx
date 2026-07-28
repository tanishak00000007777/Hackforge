import React, { useEffect, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import SelectionLayer from "./SelectionLayer";
import HoverLayer from "./HoverLayer";

import DropLayer from "./DropLayer";

export default function OverlayEngine({ dropTarget }) {
  const hoveredId = useEditorStore((state) => state.hoveredId);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const zoom = useEditorStore((state) => state.zoom);
  const draggedComponentId = useEditorStore((state) => state.draggedComponentId);

  const [hoverRect, setHoverRect] = useState(null);
  const [selectionRects, setSelectionRects] = useState({});
  const [dropRect, setDropRect] = useState(null);

  useEffect(() => {
    const updateRects = () => {
      const root = document.getElementById("canvas-root");
      if (!root) return;
      
      const rootRect = root.getBoundingClientRect();

      // Update Hover Rect
      if (hoveredId && !selectedIds.includes(hoveredId) && !draggedComponentId) {
        const node = document.querySelector(`[data-node-id="${hoveredId}"]`);
        if (node) {
          const rect = node.getBoundingClientRect();
          setHoverRect({
            top: (rect.top - rootRect.top) / (zoom / 100),
            left: (rect.left - rootRect.left) / (zoom / 100),
            width: rect.width / (zoom / 100),
            height: rect.height / (zoom / 100),
          });
        } else {
          setHoverRect(null);
        }
      } else {
        setHoverRect(null);
      }

      // Update Selection Rects
      const newSelectionRects = {};
      selectedIds.forEach((id) => {
        const node = document.querySelector(`[data-node-id="${id}"]`);
        if (node) {
          const rect = node.getBoundingClientRect();
          newSelectionRects[id] = {
            top: (rect.top - rootRect.top) / (zoom / 100),
            left: (rect.left - rootRect.left) / (zoom / 100),
            width: rect.width / (zoom / 100),
            height: rect.height / (zoom / 100),
          };
        }
      });
      setSelectionRects(newSelectionRects);

      // Update Drop Target Rect
      if (dropTarget && dropTarget.rect) {
        const rect = dropTarget.rect;
        setDropRect({
          top: (rect.top - rootRect.top) / (zoom / 100),
          left: (rect.left - rootRect.left) / (zoom / 100),
          width: rect.width / (zoom / 100),
          height: rect.height / (zoom / 100),
          position: dropTarget.position
        });
      } else {
        setDropRect(null);
      }
    };

    updateRects();
    
    const interval = setInterval(updateRects, 1000 / 60);
    window.addEventListener("resize", updateRects);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updateRects);
    };
  }, [hoveredId, selectedIds, zoom, draggedComponentId, dropTarget]);

  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const draggedSidebarComponent = useEditorStore((state) => state.draggedSidebarComponent);

  useEffect(() => {
    if (!draggedSidebarComponent && !draggedComponentId) return;
    const handleMove = (e) => setPointer({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [draggedSidebarComponent, draggedComponentId]);

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
      {hoverRect && <HoverLayer rect={hoverRect} />}
      
      {Object.entries(selectionRects).map(([id, rect]) => (
        <SelectionLayer key={id} id={id} rect={rect} />
      ))}

      {dropRect && <DropLayer rect={dropRect} />}

      {(draggedSidebarComponent || draggedComponentId) && (
        <div 
          className="fixed z-[100] px-4 py-2 bg-violet-600 text-white rounded-lg shadow-2xl shadow-violet-500/50 font-semibold text-xs whitespace-nowrap opacity-90 backdrop-blur"
          style={{
            left: pointer.x + 16,
            top: pointer.y + 16,
          }}
        >
          {draggedSidebarComponent 
            ? draggedSidebarComponent.charAt(0).toUpperCase() + draggedSidebarComponent.slice(1)
            : "Moving item..."}
        </div>
      )}
    </div>
  );
}
