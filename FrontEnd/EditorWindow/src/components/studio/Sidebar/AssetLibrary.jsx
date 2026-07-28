import React, { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import AssetCard from "./AssetCard";

export default function AssetLibrary() {
  const assets = useEditorStore((state) => state.assets);
  const addAsset = useEditorStore((state) => state.addAsset);
  const sidebarSearch = useEditorStore((state) => state.sidebarSearch);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => {
        const url = URL.createObjectURL(file);
        let type = "image";
        if (file.type.startsWith("video")) type = "video";
        else if (file.type.startsWith("application/pdf")) type = "pdf";
        
        addAsset({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          type,
          url,
        });
      });
    }
  };

  const filteredAssets = sidebarSearch
    ? assets.filter((a) => a.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
    : assets;

  return (
    <div className="px-5 pb-10 space-y-6 flex-1 flex flex-col">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors
          ${isDragOver ? "border-[#6D28D9] bg-[#F3E8FF]" : "border-slate-200 bg-slate-50"}
        `}
      >
        <div className="text-3xl mb-2">📥</div>
        <p className="text-xs font-medium text-slate-600">
          Drag & Drop media here
        </p>
        <p className="text-[10px] text-slate-400 mt-1">
          Supports JPG, PNG, SVG, MP4
        </p>
      </div>

      {assets.length === 0 ? (
        <div className="text-center py-10 text-sm text-slate-500">
          No assets uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredAssets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}
