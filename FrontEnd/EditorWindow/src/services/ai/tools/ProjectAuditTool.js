import { runFullAudit } from "./analysisTools";

/**
 * Original tool name, kept so existing prompts keep working. The checks
 * themselves now live in analysisTools -- this only reshapes the result into
 * the sentence form the older UI expects, so there is one implementation.
 */
export const ProjectAuditTool = {
  name: "audit_project",
  description: "Scans the current canvas for UX, SEO, Accessibility, and Design consistency issues. Prefer auditProject, which returns structured findings.",
  parameters: {
    type: "object",
    properties: {},
  },
  execute: async (args, context) => {
    const components = context.getSnapshot().components;
    const { findings, metrics } = runFullAudit(components);

    if (findings.length === 0) {
      return { success: true, data: { findings: [], metrics }, message: "Project looks perfect! No issues found." };
    }

    return {
      success: true,
      data: { findings, metrics },
      message: "Audit complete. Found the following issues:\n- " + findings.map((f) => f.message).join("\n- "),
    };
  },
};
