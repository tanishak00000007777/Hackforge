import React from "react";
import { useEditorStore } from "@/store/editorStore";
import Section from "./Section";

export default function ThemeInspector() {
  const globalTheme = useEditorStore((state) => state.globalTheme);
  const updateGlobalTheme = useEditorStore((state) => state.updateGlobalTheme);

  if (!globalTheme) return null;

  const mode = globalTheme.mode || "light";
  const tokens = globalTheme.tokens[mode];

  if (!tokens) return null;

  const handleUpdate = (group, key, value) => {
    updateGlobalTheme({
      tokens: {
        ...globalTheme.tokens,
        [mode]: {
          ...globalTheme.tokens[mode],
          [group]: {
            ...globalTheme.tokens[mode][group],
            [key]: value,
          },
        },
      },
    });
  };

  const handleModeToggle = () => {
    updateGlobalTheme({
      mode: mode === "light" ? "dark" : "light",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-700">Theme Mode</span>
        <button
          onClick={handleModeToggle}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
        </button>
      </div>

      {Object.entries(tokens).map(([groupKey, groupTokens]) => (
        <Section key={groupKey} title={groupKey.charAt(0).toUpperCase() + groupKey.slice(1)}>
          <div className="space-y-4 mt-4">
            {Object.entries(groupTokens).map(([key, value]) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600 capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </label>
                {groupKey === "color" || key.toLowerCase().includes("color") || key.toLowerCase().includes("bg") ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md border border-slate-200 shrink-0"
                      style={{ backgroundColor: value }}
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleUpdate(groupKey, key, e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:border-[#2B0A5A] focus:outline-none"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleUpdate(groupKey, key, e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:border-[#2B0A5A] focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}
