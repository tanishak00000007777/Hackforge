import { contextEngine } from "./ContextEngine";
import { memoryManager } from "./MemoryManager";
import { reasoningEngine } from "./ReasoningEngine";
import { planningEngine } from "./PlanningEngine";
import { ResponseFormatter } from "./ResponseFormatter";
import { useEditorStore } from "@/store/editorStore";
import { diffTrees, describeDiff } from "@/builder/commands/diffTree";
import { registerAllTools } from "./tools";

registerAllTools();

const EDIT_INTENT = /\b(add|apply|change|create|delete|edit|generate|insert|make|move|remove|replace|rewrite|set|update)\b/i;

class ConversationManager {

  /**
   * Called by the UI (AICopilot.jsx) when the user sends a message.
   *
   * Returns { message, change } where `change` describes exactly what the turn
   * did to the canvas and how many history steps to rewind. The AI edits the
   * page directly, so the user needs to see the change and be able to reject
   * it in one click -- not hunt for it and press undo an unknown number of
   * times.
   */
  async handleUserPrompt(prompt) {
    const before = useEditorStore.getState();
    const treeBefore = structuredClone(before.components);
    const historyBefore = before.history.length;
    const pageBefore = before.currentPageId;

    try {
      // 1. Snapshot the world state so the AI has context
      contextEngine.updateSnapshot(before);

      // 2. Add user message to memory
      memoryManager.addMessage("user", prompt);

      // 3. Understand & Reason
      const { reasoningText, toolCalls } = await reasoningEngine.analyzeRequest(prompt);

      // 4. Plan, Execute & Verify
      const rawFinalResponse = await planningEngine.executePlan(reasoningText, toolCalls);

      // 5. Format Response
      let finalMessage = ResponseFormatter.formatResponse(rawFinalResponse);
      const change = this.#describeChange(treeBefore, historyBefore, pageBefore);
      if (!change && toolCalls.length > 0 && EDIT_INTENT.test(prompt)) {
        finalMessage = "I could not apply that change. Try selecting the exact element and ask again.";
      }

      // 6. Update Memory with final AI Response
      memoryManager.addMessage("ai", finalMessage);

      return { message: finalMessage, change };
    } catch (err) {
      console.error("AI Agent Error:", err);
      // The provider already phrases its failures for a non-technical reader;
      // only unexpected internal errors need a generic wrapper.
      const errorMsg = /^[A-Z].*[.?]$/.test(err.message || "")
        ? err.message
        : "Something went wrong while making that change. Please try again.";
      memoryManager.addMessage("ai", errorMsg);
      return { message: errorMsg, change: this.#describeChange(treeBefore, historyBefore, pageBefore) };
    }
  }

  /** What this turn did to the canvas, and how to take it back. */
  #describeChange(treeBefore, historyBefore, pageBefore) {
    const state = useEditorStore.getState();

    // Switching pages resets history, so a rewind count would be meaningless
    // and the trees are not comparable anyway.
    if (state.currentPageId !== pageBefore) {
      return { changed: true, pageSwitched: true, undoSteps: 0, summary: "opened another page", lines: [] };
    }

    const diff = diffTrees(treeBefore, state.components);
    if (!diff.changed) return null;

    return {
      changed: true,
      pageSwitched: false,
      undoSteps: Math.max(0, state.history.length - historyBefore),
      summary: diff.summary,
      lines: describeDiff(diff),
      counts: { added: diff.added.length, removed: diff.removed.length, modified: diff.modified.length },
    };
  }

  /** Reject the last AI turn by rewinding exactly the steps it made. */
  revertChange(change) {
    if (!change?.undoSteps) return false;
    const { undo } = useEditorStore.getState();
    for (let step = 0; step < change.undoSteps; step++) undo();
    return true;
  }

  getChatHistory() {
    return memoryManager.getChatHistory();
  }

  clearMemory() {
    memoryManager.clear();
  }
}

export const conversationManager = new ConversationManager();
