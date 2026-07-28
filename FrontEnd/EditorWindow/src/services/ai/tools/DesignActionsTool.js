import { editorAdapter } from "../EditorAdapter";

export const DesignActionsTool = {
  name: "update_design",
  description: "Updates typography, colors, spacing, borders, shadows, and radius for a specified component.",
  parameters: {
    type: "object",
    properties: {
      componentId: {
        type: "string",
        description: "The ID of the component to update. If null, the AI should try to find the selected element or target the root."
      },
      changes: {
        type: "object",
        description: "An object containing the style changes to apply (e.g. { backgroundColor: '#000', padding: '32px' })"
      }
    },
    required: ["changes"]
  },
  execute: async (args, context) => {
    let targetId = args.componentId;
    
    // If AI didn't provide an ID, try to use the selected node
    if (!targetId) {
      const selected = context.getSelectedNode();
      if (selected) {
        targetId = selected.id;
      } else {
        return { success: false, error: "No component selected or specified to update." };
      }
    }

    editorAdapter.updateComponent(targetId, { styles: args.changes });
    return { success: true, message: `Updated component ${targetId} successfully.` };
  }
};
