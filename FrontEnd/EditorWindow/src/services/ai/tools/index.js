/**
 * Every AI-callable tool, registered in one place.
 * Add a tool to its category file and export it in that file's array -- no
 * edits needed anywhere else.
 */
import { toolRegistry } from "../ToolRegistry";

import { selectionTools } from "./selectionTools";
import { canvasTools } from "./canvasTools";
import { pageTools } from "./pageTools";
import { sectionTools } from "./sectionTools";
import { elementTools } from "./elementTools";
import { styleTools } from "./styleTools";
import { responsiveTools } from "./responsiveTools";
import { themeTools } from "./themeTools";
import { templateTools } from "./templateTools";
import { assetTools } from "./assetTools";
import { analysisTools } from "./analysisTools";
import { contentTools } from "./contentTools";
import { composeTools } from "./composeTools";
import { utilityTools } from "./utilityTools";
import { aiTools } from "./aiTools";
import { metaTools } from "./metaTools";

// Original tools, kept working under their original names.
import { DesignActionsTool } from "./DesignActionsTool";
import { ComponentGeneratorTool } from "./ComponentGeneratorTool";
import { ProjectAuditTool } from "./ProjectAuditTool";
import { RemoveComponentTool } from "./RemoveComponentTool";

export const toolsByCategory = {
  selection: selectionTools,
  canvas: canvasTools,
  page: pageTools,
  section: sectionTools,
  element: elementTools,
  style: styleTools,
  responsive: responsiveTools,
  theme: themeTools,
  template: templateTools,
  asset: assetTools,
  analysis: analysisTools,
  content: contentTools,
  compose: composeTools,
  utility: utilityTools,
  ai: aiTools,
  meta: metaTools,
  legacy: [DesignActionsTool, ComponentGeneratorTool, ProjectAuditTool, RemoveComponentTool],
};

export const allTools = Object.values(toolsByCategory).flat();

let registered = false;

export function registerAllTools() {
  if (registered) return toolRegistry;
  const names = new Set();
  for (const tool of allTools) {
    if (names.has(tool.name)) throw new Error(`Duplicate AI tool name: ${tool.name}`);
    names.add(tool.name);
    toolRegistry.registerTool(tool);
  }
  registered = true;
  return toolRegistry;
}
