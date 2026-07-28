import { editorAdapter } from "../EditorAdapter";

export const RemoveComponentTool = {
  name: "delete_component",
  description: "Deletes the currently selected component from the canvas.",
  parameters: {
    type: "object",
    properties: {
      componentId: {
        type: "string",
        description: "Optional ID. If omitted, deletes the currently selected element."
      }
    }
  },
  execute: async (args, context) => {
    let targetId = args.componentId;
    
    if (!targetId) {
      const selected = context.getSelectedNode();
      if (selected) {
        targetId = selected.id;
      } else {
        return { success: false, error: "No component selected to delete." };
      }
    }

    editorAdapter.deleteComponent(targetId);
    return { success: true, message: `Deleted component ${targetId} successfully.` };
  }
};
