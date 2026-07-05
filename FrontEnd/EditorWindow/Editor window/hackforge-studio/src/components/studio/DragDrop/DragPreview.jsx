import React, { useEffect, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { Plus } from "lucide-react";

export default function DragPreview() {
  const draggedSidebarComponent = useEditorStore((state) => state.draggedSidebarComponent);
  const draggedAsset = useEditorStore((state) => state.draggedAsset);
  const draggedComponentId = useEditorStore((state) => state.draggedComponentId);
  
  const [pos, setPos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const handlePointerMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    if (draggedSidebarComponent || draggedAsset || draggedComponentId) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [draggedSidebarComponent, draggedAsset, draggedComponentId]);

  if (!draggedSidebarComponent && !draggedAsset && !draggedComponentId) return null;

  return (
    <div 
      className="fixed z-[9999] pointer-events-none"
      style={{
        transform: `translate(${pos.x + 10}px, ${pos.y + 10}px)`,
        willChange: "transform"
      }}
    >
      <div className="bg-[#2B0A5A] text-white px-4 py-2 rounded-xl shadow-2xl font-semibold text-sm flex items-center gap-2 opacity-90 border border-[#4B2A7A]">
        <Plus size={16} />
        {draggedSidebarComponent ? `Placing ${draggedSidebarComponent}` : ""}
        {draggedAsset ? `Placing ${draggedAsset.type}` : ""}
        {draggedComponentId ? "Moving element" : ""}
      </div>
    </div>
  );
}
