import React, { useState } from "react";
import { RotateCw } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

export default function RotationHandle({ id }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-slate-300 shadow flex items-center justify-center cursor-pointer text-slate-500 hover:text-violet-600 hover:border-violet-600 z-50 pointer-events-auto"
      onPointerDown={(e) => {
        e.stopPropagation();
        setDragging(true);
      }}
      onPointerUp={(e) => {
        setDragging(false);
      }}
    >
      <RotateCw size={12} />
    </div>
  );
}
