import { toolRegistry } from "./ToolRegistry";
import { contextEngine } from "./ContextEngine";

class ToolExecutor {
  async executeToolCall(toolCall) {
    const { name, arguments: args } = toolCall;
    
    const tool = toolRegistry.getTool(name);
    if (!tool) {
      return { success: false, error: `Tool ${name} not found.` };
    }

    try {
      // Execute the tool, injecting the context engine
      const result = await tool.execute(args, contextEngine);
      return result;
    } catch (err) {
      console.error(`Error executing tool ${name}:`, err);
      return { success: false, error: err.message };
    }
  }
}

export const toolExecutor = new ToolExecutor();
