import React from "react";
import { useEditorStore } from "@/store/editorStore";

export default function ComponentLabel({ id, label }) {
  const node = document.querySelector(`[data-node-id="${id}"]`);
  const type = node ? node.tagName.toLowerCase() : label || "Component";

  return (
    <div
      className="absolute -top-6 -left-[1.5px] bg-violet-500 text-white text-xs px-2 py-1 rounded-t-md font-medium whitespace-nowrap pointer-events-auto cursor-grab active:cursor-grabbing shadow"
      onPointerDown={(e) => {
        e.stopPropagation();
        // Here we would dispatch startDragging
      }}
    >
      {type}
    </div>
  );
}