import { useIntegrationStore } from "@/store/integrationStore";
import { saveAiMessage, getAiConversationHistory } from "@/services/hackforgeApi";

/** Keep tool results bounded in history; they can be large. */
const MAX_RESULT_CHARS = 400;

/**
 * Fire-and-forget persistence for one message. Never awaited by callers and
 * never throws -- a DB hiccup must not break the live chat, it just means
 * that one turn won't survive a refresh.
 */
function persist(role, content, toolCalls, toolCallId) {
  const session = useIntegrationStore.getState().session;
  if (!session?.accessToken || !session?.hackathonId) return;
  saveAiMessage(session, {
    role,
    content: content || "",
    tool_calls: toolCalls?.length
      ? toolCalls.map(({ id, name, arguments: args }) => ({ id, name, arguments: args || {} }))
      : null,
    tool_call_id: toolCallId || null,
  }).catch((err) => console.warn("AI conversation persistence failed:", err));
}

export class MemoryManager {
  constructor() {
    this.history = []; // Array of { role: 'user' | 'assistant' | 'tool', content: string, ... }
    // A multi-round agent turn adds an assistant + N tool-result entry per
    // round, so this needs real headroom above a single user/assistant
    // exchange -- not just enough for plain chat turns.
    this.maxHistory = 120;
    this.actions = []; // Completed tool calls, kept OUT of the message list
    this.maxActions = 8;
  }

  addMessage(role, content, options = {}) {
    // Map internal roles to Groq/OpenAI standard roles
    let apiRole = role;
    if (role === 'ai') apiRole = 'assistant';

    this.history.push({ role: apiRole, content, internal: !!options.internal });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    if (apiRole === 'user' || apiRole === 'assistant') persist(apiRole, content, null, null);
  }

  /**
   * Record the assistant's own tool-call request so it becomes part of the
   * real conversation history the model sees on the next round of the agent
   * loop -- without this, the model has no memory of what it just asked for
   * and can't tell whether a multi-step task is still in progress.
   */
  addAssistantToolCallMessage(content, toolCalls) {
    const calls = (toolCalls || []).map(
      ({ id, name, arguments: args, thought_signature }) => ({
        id,
        name,
        arguments: args || {},
        ...(thought_signature ? { thought_signature } : {}),
      })
    );
    this.history.push({
      role: 'assistant',
      content: content || '',
      tool_calls: calls,
      internal: !content,
    });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    persist('assistant', content, calls, null);
  }

  /** Record one tool's result as a real `tool` role turn (see addAssistantToolCallMessage). */
  addToolResultMessage(toolCallId, name, result) {
    const content = JSON.stringify(result).slice(0, MAX_RESULT_CHARS);
    this.history.push({
      role: 'tool',
      tool_call_id: toolCallId,
      name,
      content,
      internal: true,
    });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    persist('tool', content, null, toolCallId);
  }

  /**
   * Load persisted history for the current hackathon/user, replacing local
   * memory -- called once when the Assistant panel first opens (see
   * ConversationManager.hydrate). No-op if this session already has local
   * history (a fresh in-progress chat should not be overwritten) or if the
   * studio session isn't connected yet.
   */
  async hydrate() {
    if (this.history.length > 0) return;
    const session = useIntegrationStore.getState().session;
    if (!session?.accessToken || !session?.hackathonId) return;
    try {
      const rows = await getAiConversationHistory(session);
      this.history = (rows || []).map((row) => ({
        role: row.role,
        content: row.content || '',
        tool_calls: row.tool_calls || undefined,
        tool_call_id: row.tool_call_id || undefined,
        internal: row.role === 'tool' || (row.role === 'assistant' && !row.content),
      }));
    } catch (err) {
      console.warn("Failed to load AI conversation history:", err);
    }
  }

  /**
   * Record a completed tool call.
   *
   * This must NOT become a system-role message. A model reads system text as
   * an instruction, so "[SYSTEM ACTION]: createSection -> ..." sitting in the
   * conversation reads as "call createSection" -- and since these accumulate,
   * every later prompt drifted towards creating another empty section. They
   * live in a separate log and are surfaced through the system prompt as work
   * that is already finished.
   */
  logAction(actionDesc) {
    this.actions.push(actionDesc);
    if (this.actions.length > this.maxActions) this.actions.shift();
  }

  /** Completed actions, newest last, for the "already done" prompt block. */
  getRecentActions() {
    return [...this.actions];
  }

  /**
   * What the UI renders: the human-readable conversation, without the
   * machine plumbing -- tool-result turns and empty tool-call dispatches
   * never had anything a person should read.
   */
  getChatHistory() {
    return this.history.filter((message) => !message.internal && message.role !== 'tool');
  }

  /**
   * Everything, including tool calls/results, for the model's context.
   *
   * Only the wire fields the backend schema accepts (role, content,
   * tool_calls, tool_call_id, name) -- bookkeeping like `internal` must
   * never reach the API.
   */
  getFormattedHistoryForAPI() {
    return this.history.map(({ role, content, tool_calls, tool_call_id, name }) => {
      const message = { role, content: content || '' };
      if (tool_calls?.length) message.tool_calls = tool_calls;
      if (tool_call_id) message.tool_call_id = tool_call_id;
      if (name) message.name = name;
      return message;
    });
  }

  clear() {
    this.history = [];
    this.actions = [];
  }
}

export const memoryManager = new MemoryManager();
