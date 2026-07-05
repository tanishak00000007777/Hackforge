import React from "react";
import { useEditorStore } from "@/store/editorStore";

export default function AssetCard({ asset }) {
  const setDraggedAsset = useEditorStore((state) => state.setDraggedAsset);
  const removeAsset = useEditorStore((state) => state.removeAsset);

  const handlePointerDown = (e) => {
    e.preventDefault();
    setDraggedAsset(asset);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      className="group relative flex flex-col rounded-xl border border-[#E8E8EF] bg-white p-2 transition-all hover:border-[#6D28D9] hover:shadow-md cursor-grab active:cursor-grabbing"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center">
        {asset.type === "image" ? (
          <img src={asset.url} alt={asset.name} className="object-cover w-full h-full" draggable={false} />
        ) : asset.type === "video" ? (
          <video src={asset.url} className="object-cover w-full h-full" muted />
        ) : (
          <div className="text-2xl text-slate-400">📄</div>
        )}
        
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            removeAsset(asset.id);
          }}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm text-red-500 hover:bg-red-50 transition-opacity"
        >
          ✕
        </button>
      </div>

      <div className="mt-2 text-center">
        <h4 className="text-[11px] font-semibold text-slate-800 truncate px-1">
          {asset.name}
        </h4>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
          {asset.type}
        </p>
      </div>
    </div>
  );
}
