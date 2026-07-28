import React, { useState, useEffect } from "react";
import { useEditorStore } from "@/store/editorStore";

export default function AssetPicker({ field, value, onChange }) {
  const [localValue, setLocalValue] = useState(value || "");
  const assets = useEditorStore((state) => state.assets);
  const setSidebarTab = useEditorStore((state) => state.setSidebarTab);

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 mb-2">
        {value ? (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
            <img src={value} alt="Selected asset" className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="relative aspect-video w-full rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
            <span className="text-xs text-slate-400 font-medium">No asset selected</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-700">Choose from Library</label>
        {assets.length === 0 ? (
          <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 text-center">
            Your library is empty.
            <button 
              onClick={() => setSidebarTab("Assets")}
              className="text-violet-600 font-medium ml-1 hover:underline"
            >
              Upload media
            </button>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-2 pb-2 snap-x">
            {assets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => onChange(asset.url)}
                className={`
                  relative shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all snap-start
                  ${value === asset.url ? "border-violet-600 shadow-sm" : "border-transparent hover:border-slate-300"}
                `}
              >
                {asset.type === "image" ? (
                  <img src={asset.url} alt={asset.name} className="object-cover w-full h-full" />
                ) : asset.type === "video" ? (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-xs">▶</div>
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px]">DOC</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-slate-400 font-medium shrink-0">Or Paste URL:</span>
        <input
          type="text"
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
          }}
          onBlur={() => {
            if (localValue !== value) onChange(localValue);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && localValue !== value) onChange(localValue);
          }}
          placeholder="https://..."
          className="flex-1 px-2 py-1.5 text-[11px] border border-[#E8E8EF] rounded-md focus:border-[#6D28D9] focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
}
