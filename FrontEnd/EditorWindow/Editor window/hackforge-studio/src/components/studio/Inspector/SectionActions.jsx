import React from "react";
import { useEditorStore } from "@/store/editorStore";
import { exportTemplate } from "@/builder/utils/TemplateManager";

export default function SectionActions({ section }) {
  const duplicateComponent = useEditorStore((state) => state.duplicateComponent);
  const saveTemplate = useEditorStore((state) => state.saveTemplate);
  const deleteComponent = useEditorStore((state) => state.deleteComponent);

  const handleDuplicate = () => {
    duplicateComponent(section.id);
  };

  const handleSave = () => {
    const name = prompt("Enter a name for this section template:", section.type);
    if (!name) return;
    
    saveTemplate({
      id: Math.random().toString(36).substring(2, 9),
      name,
      type: "section",
      category: "Custom",
      data: structuredClone(section),
    });
    alert("Saved to Templates Library!");
  };

  const handleExport = () => {
    const name = section.type || "section";
    exportTemplate(section, `section-${name}.json`);
  };

  const handleDelete = () => {
    deleteComponent(section.id);
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-slate-200">
      <button
        onClick={handleDuplicate}
        className="px-3 py-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex-1"
      >
        Duplicate
      </button>
      <button
        onClick={handleSave}
        className="px-3 py-1.5 text-[11px] font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-md transition-colors flex-1"
      >
        Save Template
      </button>
      <button
        onClick={handleExport}
        className="px-3 py-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex-1"
      >
        Export JSON
      </button>
      <button
        onClick={handleDelete}
        className="px-3 py-1.5 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
        title="Delete Section"
      >
        ✕
      </button>
    </div>
  );
}
