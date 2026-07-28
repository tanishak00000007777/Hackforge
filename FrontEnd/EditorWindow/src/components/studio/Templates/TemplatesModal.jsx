import React, { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { duplicateNode } from "@/builder/factories/coreFactory";

export default function TemplatesModal() {
  const isTemplatesModalOpen = useEditorStore((state) => state.isTemplatesModalOpen);
  const setTemplatesModalOpen = useEditorStore((state) => state.setTemplatesModalOpen);
  const savedTemplates = useEditorStore((state) => state.savedTemplates);
  const addComponent = useEditorStore((state) => state.addComponent);
  const loadProjectTemplate = useEditorStore((state) => state.loadProjectTemplate);
  const deleteTemplate = useEditorStore((state) => state.deleteTemplate);

  const [activeTab, setActiveTab] = useState("section");

  if (!isTemplatesModalOpen) return null;

  const filteredTemplates = savedTemplates.filter(t => t.type === activeTab);

  const handleUseTemplate = (template) => {
    if (template.type === "section") {
      const newSection = duplicateNode(template.data);
      addComponent(newSection);
      setTemplatesModalOpen(false);
    } else if (template.type === "page" || template.type === "website") {
      const confirm = window.confirm("Applying a website/page template will overwrite your current canvas. Continue?");
      if (confirm) {
        const clonedComponents = template.data.components.map(c => duplicateNode(c));
        loadProjectTemplate({
          components: clonedComponents,
          globalTheme: template.data.globalTheme
        });
        setTemplatesModalOpen(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Template Library</h2>
            <p className="text-sm text-slate-500 mt-1">Marketplace-ready JSON templates</p>
          </div>
          <button 
            onClick={() => setTemplatesModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 px-8 border-b border-slate-100 bg-slate-50/50">
          {["section", "page", "website"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 text-sm font-semibold capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}s
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4 opacity-50">📂</div>
              <h3 className="text-lg font-semibold text-slate-700">No {activeTab} templates saved.</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Save sections from the Inspector or save entire projects from the Top Navbar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group">
                  <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center text-4xl text-slate-300 relative">
                    {template.type === "section" ? "🧩" : "🌐"}
                    
                    {/* Delete button (only visible on hover) */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id); }}
                      className="absolute top-3 right-3 bg-white text-red-500 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      title="Delete Template"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-800 truncate">{template.name}</h4>
                        <p className="text-xs text-slate-500 capitalize">{template.category || "Custom"}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleUseTemplate(template)}
                      className="w-full py-2 bg-violet-50 text-violet-600 hover:bg-[#2B0A5A] hover:text-white font-medium text-sm rounded-lg transition-colors"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
