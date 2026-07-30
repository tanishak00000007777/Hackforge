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

    // Hard stops for the agent loop below: without these, a single prompt
    // could keep calling tools indefinitely (cost/runaway risk). Well above
    // what any real page-building request should need.
    const MAX_ROUNDS = 10;
    const MAX_TOTAL_TOOL_CALLS = 40;

    try {
      // 1. Snapshot the world state so the AI has context
      contextEngine.updateSnapshot(before);

      // 2. Add user message to memory
      memoryManager.addMessage("user", prompt);

      // 3-4. Understand & Reason -> Plan & Execute, looping until the model
      // has no more tool calls to make. A single reasoning call caps out at
      // ~8 tool calls per round; a prompt that genuinely needs many steps
      // (e.g. "build a full landing page") needs to see its own results and
      // decide to keep going, which is what this loop enables.
      let finalMessage = "";
      let totalToolCalls = 0;
      let anyToolCalls = false;

      for (let round = 0; round < MAX_ROUNDS; round++) {
        const { reasoningText, toolCalls } = await reasoningEngine.analyzeRequest(prompt);

        if (!toolCalls || toolCalls.length === 0) {
          finalMessage = reasoningText;
          break;
        }

        anyToolCalls = true;
        memoryManager.addAssistantToolCallMessage(reasoningText, toolCalls);
        totalToolCalls += toolCalls.length;

        const { failures, succeeded, rateLimited } = await planningEngine.executeToolCalls(toolCalls);

        if (failures.length > 0) {
          finalMessage = succeeded === 0
            ? (rateLimited
                ? "The AI service hit its rate limit. Please try again in a moment."
                : await planningEngine.explainFailure(reasoningText, failures))
            : `I applied ${succeeded} change${succeeded === 1 ? "" : "s"}, but could not finish ${failures.length} other step${failures.length === 1 ? "" : "s"}.`;
          break;
        }

        if (totalToolCalls >= MAX_TOTAL_TOOL_CALLS || round === MAX_ROUNDS - 1) {
          finalMessage = "I made a lot of changes and stopped to keep things manageable — let me know if you'd like me to continue.";
          break;
        }
      }

      if (!finalMessage) {
        finalMessage = totalToolCalls > 0 ? `Done — ${totalToolCalls} change${totalToolCalls === 1 ? "" : "s"} applied.` : "Done.";
      }

      // 5. Format Response
      finalMessage = ResponseFormatter.formatResponse(finalMessage);
      const change = this.#describeChange(treeBefore, historyBefore, pageBefore);
      if (!change && anyToolCalls && EDIT_INTENT.test(prompt)) {
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

  /** Load persisted conversation history for the current session (see MemoryManager.hydrate). */
  async hydrate() {
    await memoryManager.hydrate();
  }

  clearMemory() {
    memoryManager.clear();
  }
}

export const conversationManager = new ConversationManager();
