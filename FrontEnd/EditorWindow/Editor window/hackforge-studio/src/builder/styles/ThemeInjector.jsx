import React from "react";
import { useEditorStore } from "@/store/editorStore";

export default function ThemeInjector() {
  const globalTheme = useEditorStore((state) => state.globalTheme);
  if (!globalTheme) return null;

  const mode = globalTheme.mode || "light";
  const tokens = globalTheme.tokens[mode];
  if (!tokens) return null;

  // Flatten tokens into CSS variables
  const cssVars = [];

  const processTokens = (obj, prefix = "") => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && value !== null) {
        processTokens(value, `${prefix}${key}-`);
      } else {
        cssVars.push(`--token-${prefix}${key}: ${value};`);
      }
    }
  };

  processTokens(tokens);

  const styleString = `
    #canvas-root {
      ${cssVars.join("\n      ")}
    }
  `;

  return (
    <style>{styleString}</style>
  );
}
