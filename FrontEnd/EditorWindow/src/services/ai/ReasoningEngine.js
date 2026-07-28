import { aiProvider } from "./providers/AIProvider";
import { PromptBuilder } from "./PromptBuilder";
import { selectTools } from "./ToolRouter";
import { toolRegistry } from "./ToolRegistry";
import { memoryManager } from "./MemoryManager";

export class ReasoningEngine {
  /**
   * Understand -> Reason step.
   * Prompts the LLM with the context to determine the best course of action.
   */
  async analyzeRequest(userPrompt) {
    const systemPrompt = PromptBuilder.buildSystemPrompt();
    const history = memoryManager.getFormattedHistoryForAPI();
    // Only the tools relevant to this turn; the rest stay reachable via
    // discoverTools/callTool. Sending all of them costs ~8k tokens.
    const availableTools = toolRegistry.getSchemasFor(selectTools(userPrompt));

    // The LLM will perform reasoning (in its message content) 
    // and planning (by selecting toolCalls)
    const response = await aiProvider.sendPrompt(systemPrompt, history, availableTools);
    
    return {
      reasoningText: response.message,
      toolCalls: response.toolCalls || []
    };
  }
}

export const reasoningEngine = new ReasoningEngine();
