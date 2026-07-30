import { toolExecutor } from "./ToolExecutor";
import { memoryManager } from "./MemoryManager";
import { aiProvider } from "./providers/AIProvider";

/** Keep tool results out of the history at full size; they can be large. */
const MAX_RESULT_CHARS = 400;

export function describeResult(name, result) {
  if (!result?.success) return `${name} failed: ${result?.error || "unknown error"}`;

  const detail = Object.entries(result.data || {})
    .filter(([, value]) => value !== null && value !== undefined && typeof value !== "object")
    .map(([key, value]) => `${key}=${value}`)
    .slice(0, 4)
    .join(", ");

  return `${name} succeeded${detail ? ` (${detail})` : ""}`;
}

export class PlanningEngine {
  /**
   * Execute one round's tool calls and record each result as a real `tool`
   * turn in memory (see MemoryManager.addToolResultMessage), so the next
   * round of the agent loop can see what happened and decide whether to
   * keep going. Returns structured outcomes -- the caller (ConversationManager's
   * loop) decides whether/how to summarise, since a round with no failures
   * isn't necessarily the end of the turn.
   */
  async executeToolCalls(toolCalls) {
    const outcomes = [];
    for (const toolCall of toolCalls) {
      const result = await toolExecutor.executeToolCall(toolCall);
      outcomes.push({ id: toolCall.id, name: toolCall.name, result });
      memoryManager.logAction(`${toolCall.name} -> ${JSON.stringify(result).slice(0, MAX_RESULT_CHARS)}`);
      memoryManager.addToolResultMessage(toolCall.id, toolCall.name, result);
    }

    const failures = outcomes.filter((outcome) => !outcome.result?.success);
    const succeeded = outcomes.length - failures.length;
    const rateLimited = failures.some(({ result }) => /rate limit/i.test(result?.error || ""));

    return { outcomes, failures, succeeded, rateLimited };
  }

  /**
   * One round-trip so the model can explain a total failure, carrying only
   * the failures rather than the whole history. Deliberately NOT the full
   * system prompt: explaining a failure needs no page context or tool list,
   * and rebuilding them costs ~1k tokens against a per-minute budget that is
   * already under strain from the round that just failed.
   */
  async explainFailure(reasoningText, failures) {
    try {
      const explanation = await aiProvider.sendPrompt(
        "You are a friendly design assistant talking to someone who does not know how the editor works internally. " +
          "Some internal steps failed. In at most two sentences, say plainly what could not be done and what the " +
          "person can try instead. Never mention tool names, ids, parameters or error codes. Do not call tools.",
        [
          {
            role: "user",
            content:
              `The user asked for: ${reasoningText || "a change to the page"}\n` +
              `Internal failures: ${failures.map(({ name, result }) => `${name}: ${result?.error}`).join("; ")}\n` +
              "Nothing was changed.",
          },
        ],
        [],
      );
      const message = explanation.message?.trim();
      if (message) return message;
    } catch (err) {
      console.error("Failure-explanation error:", err);
    }

    // Fallback if that call fails too: still no internals in the chat.
    return "I couldn't make that change. Could you describe it a different way, or select the element you mean first?";
  }
}

export const planningEngine = new PlanningEngine();
