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
   * Plan -> Execute -> Verify.
   *
   * Verification used to be a second full-context LLM call on every turn,
   * which doubled the token cost of a request that was already at the limit.
   * Tools now return structured results, so a clean run is summarised locally
   * and only genuine failures are worth asking the model about.
   */
  async executePlan(reasoningText, toolCalls, onStage = () => {}) {
    if (!toolCalls || toolCalls.length === 0) {
      return reasoningText;
    }

    const outcomes = [];
    for (const [index, toolCall] of toolCalls.entries()) {
      onStage({ stage: "applying", done: index, total: toolCalls.length });
      const result = await toolExecutor.executeToolCall(toolCall);
      outcomes.push({ name: toolCall.name, result });
      memoryManager.logAction(`${toolCall.name} -> ${JSON.stringify(result).slice(0, MAX_RESULT_CHARS)}`);
    }

    onStage({ stage: "applying", done: toolCalls.length, total: toolCalls.length });

    const failures = outcomes.filter((outcome) => !outcome.result?.success);
    const succeeded = outcomes.length - failures.length;

    // Raw tool output stays in memory (the model needs the detail on the next
    // turn) but never reaches the chat: "callTool failed: No tool named
    // 'changeFontFamily'" means nothing to the person using the editor.
    if (failures.length === 0) {
      const done = succeeded === 1 ? "Done." : `Done — ${succeeded} changes applied.`;
      return reasoningText?.trim() ? `${reasoningText.trim()}\n\n${done}` : done;
    }

    if (succeeded > 0) {
      return `I applied ${succeeded} change${succeeded === 1 ? "" : "s"}, but could not finish ${failures.length} other step${failures.length === 1 ? "" : "s"}.`;
    }

    // Something broke: one round-trip so the model can explain or suggest
    // another route, carrying only the failures rather than the whole history.
    // A rate-limited turn must not spend another request explaining itself --
    // that is what turns one 429 into a minute of them.
    const rateLimited = failures.some(({ result }) => /rate limit/i.test(result?.error || ""));
    if (rateLimited) {
      return "The AI service hit its rate limit. Please try again in a moment.";
    }

    try {
      const explanation = await aiProvider.sendPrompt(
        // Deliberately NOT the full system prompt: explaining a failure needs
        // no page context or tool list, and rebuilding them costs ~1k tokens
        // against a per-minute budget that is already under strain.
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
