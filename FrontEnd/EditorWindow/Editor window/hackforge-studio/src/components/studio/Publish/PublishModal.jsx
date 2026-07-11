import React, { useState, useEffect } from "react";
import { useEditorStore } from "@/store/editorStore";
import { exportTemplate } from "@/builder/utils/TemplateManager";
import { exportReactProject } from "@/builder/utils/ProjectExporter";

const PIPELINE_STEPS = [
  { id: "build", label: "Generating Production Build" },
  { id: "bundle", label: "Running Bundle Optimization" },
  { id: "assets", label: "Optimizing Assets" },
  { id: "hooks", label: "Executing Deployment Hooks" },
];

export default function PublishModal({ isOpen, onClose }) {
  const components = useEditorStore((state) => state.components);
  const globalTheme = useEditorStore((state) => state.globalTheme);
  
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setIsFinished(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentStepIndex >= 0 && currentStepIndex < PIPELINE_STEPS.length) {
      const timer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, 800 + Math.random() * 800); // Simulate realistic varying step durations
      return () => clearTimeout(timer);
    } else if (currentStepIndex === PIPELINE_STEPS.length) {
      setIsFinished(true);
    }
  }, [currentStepIndex]);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    exportTemplate({
      type: "website",
      name: "Published Site",
      data: { components, globalTheme }
    }, "published-site.json");
  };

  const handleExportReact = () => {
    exportReactProject(components, globalTheme);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Preparing Project Export</h2>
            <p className="text-sm text-slate-500 mt-1">Building downloadable production files</p>
          </div>
          {isFinished && (
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 bg-white border border-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Pipeline Simulation */}
        <div className="p-8">
          <div className="space-y-6">
            {PIPELINE_STEPS.map((step, index) => {
              const isPast = currentStepIndex > index;
              const isActive = currentStepIndex === index;
              
              return (
                <div key={step.id} className="flex items-center gap-4">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors duration-300
                    ${isPast ? "bg-green-500 border-green-500 text-white" : 
                      isActive ? "bg-white border-[#2B0A5A] text-[#2B0A5A]" : 
                      "bg-white border-slate-200 text-slate-300"}
                  `}>
                    {isPast ? "✓" : isActive ? "⋯" : (index + 1)}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isPast || isActive ? "text-slate-800" : "text-slate-400"}`}>
                      {step.label}
                    </p>
                    {isActive && (
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-[#2B0A5A] h-full w-1/2 animate-pulse rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Success State */}
          {isFinished && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 rounded-xl border border-green-100 text-green-800">
                <span className="text-2xl">🚀</span>
                <div>
                  <h4 className="font-semibold text-sm">Export Ready</h4>
                  <p className="text-xs opacity-80">Choose a download format below.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleExportReact}
                  className="flex flex-col items-center justify-center gap-2 py-4 bg-white border border-slate-200 hover:border-[#2B0A5A] hover:bg-slate-50 rounded-xl transition-all group"
                >
                  <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">📦</span>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-violet-700">Export React ZIP</span>
                </button>
                <button 
                  onClick={handleExportJSON}
                  className="flex flex-col items-center justify-center gap-2 py-4 bg-white border border-slate-200 hover:border-blue-600 hover:bg-blue-50 rounded-xl transition-all group"
                >
                  <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">📄</span>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">Export JSON</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
