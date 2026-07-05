import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { Trash2 } from "lucide-react";
import Inspector from "./Inspector";
import ThemeInspector from "./ThemeInspector";
import PremiumCard from "./PremiumCard";
import FooterStatus from "./FooterStatus";

export default function RightPanel() {
  const [activeTab, setActiveTab] = useState("component"); // "component" or "theme"

  const selectedIds = useEditorStore((state) => state.selectedIds);
  const components = useEditorStore((state) => state.components);
  const deleteComponent = useEditorStore((state) => state.deleteComponent);
  const select = useEditorStore((state) => state.select);

  const selectedId = selectedIds[0];
  const selected = components.find((component) => component.id === selectedId);

  return (
    <aside className="w-[380px] shrink-0 border-l border-[#E7E8F4]/60 bg-[#FCFBFE] flex flex-col">
      {/* ======================================
          HEADER
      ======================================= */}
      <div className="px-6 py-5 border-b border-[#E7E8F4]/60">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Inspector</h2>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("component")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === "component" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Component
            </button>
            <button
              onClick={() => setActiveTab("theme")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === "theme" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Theme
            </button>
          </div>
        </div>

        {activeTab === "component" && (
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-slate-500 capitalize">
              {selected ? selected.type : "No Selection"}
            </p>
            {selected && (
              <button
                onClick={() => {
                  deleteComponent(selected.id);
                  select(null);
                }}
                className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                title="Delete Component (Backspace)"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
        {activeTab === "theme" && (
          <p className="mt-1 text-sm text-slate-500">
            Global Design System
          </p>
        )}
      </div>

      {/* ======================================
          INSPECTOR
      ======================================= */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "component" ? <Inspector /> : <ThemeInspector />}
      </div>

      {/* ======================================
          FOOTER
      ======================================= */}
      <div className="border-t border-[#E7E8F4]/60 p-5 space-y-4">
        <PremiumCard />
        <FooterStatus />
      </div>
    </aside>
  );
}