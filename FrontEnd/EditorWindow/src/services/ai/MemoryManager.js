export class MemoryManager {
  constructor() {
    this.history = []; // Array of { role: 'user' | 'assistant', content: string }
    this.maxHistory = 20; // Keep last 20 messages for context window
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

  /** What the UI renders: the conversation, without the machine plumbing. */
  getChatHistory() {
    return this.history.filter((message) => !message.internal);
  }

  /**
   * Everything, including tool results, for the model's context.
   *
   * Only role and content: the chat API rejects a message carrying any extra
   * field, so bookkeeping like `internal` must never reach the wire.
   */
  getFormattedHistoryForAPI() {
    return this.history.map(({ role, content }) => ({ role, content }));
  }

  clear() {
    this.history = [];
    this.actions = [];
  }
}

export const memoryManager = new MemoryManager();
