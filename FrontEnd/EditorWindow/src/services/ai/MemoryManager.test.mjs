// Run: npm test
//
// Regression: adding an `internal` flag for UI filtering leaked that field
// into the API payload. Chat APIs reject a message with any unknown field, so
// every request came back 400 and the copilot said "check your connection".
import assert from "node:assert/strict";
import { MemoryManager } from "./MemoryManager.js";

const memory = new MemoryManager();
memory.addMessage("user", "add a new section");
memory.logAction("createSection -> {\"success\":true,\"data\":{\"id\":\"abc\"}}");
memory.addMessage("ai", "Done.");

/* --- tool results must never appear as conversation messages ---
   A system-role message naming a tool reads to the model as an instruction to
   call it. They accumulated, so every prompt drifted into "createSection". */
const wire = memory.getFormattedHistoryForAPI();
assert.ok(!wire.some((m) => m.role === "system"), "no system-role messages inside the conversation");
assert.ok(
  !wire.some((m) => m.content.includes("createSection")),
  "a completed tool call must not sit in the message list where it reads as a directive",
);
assert.deepEqual(wire.map((m) => m.role), ["user", "assistant"], "clean alternating turns");

/* --- but the model is still told what has been done, as finished work --- */
const actions = memory.getRecentActions();
assert.equal(actions.length, 1);
assert.ok(actions[0].includes("createSection"), "completed work is still available to the prompt builder");

/* --- what goes to the API: role and content, nothing else --- */
assert.equal(wire.length, 2, "only real conversation turns");
for (const message of wire) {
  assert.deepEqual(
    Object.keys(message).sort(),
    ["content", "role"],
    `message carries fields the API will reject: ${Object.keys(message).join(", ")}`,
  );
}
/* --- what the UI renders: no machine plumbing --- */
const chat = memory.getChatHistory();
assert.equal(chat.length, 2, "the raw tool log is hidden from the chat");
assert.ok(!chat.some((m) => m.content.includes("[SYSTEM ACTION]")));
assert.deepEqual(chat.map((m) => m.role), ["user", "assistant"], "'ai' maps to the API's 'assistant'");

/* --- the action log is bounded too, so old calls stop influencing prompts --- */
const busy = new MemoryManager();
for (let i = 0; i < busy.maxActions + 5; i++) busy.logAction(`tool${i} -> {}`);
assert.equal(busy.getRecentActions().length, busy.maxActions);
assert.ok(busy.getRecentActions().at(-1).startsWith(`tool${busy.maxActions + 4}`), "newest kept");
assert.equal(busy.getFormattedHistoryForAPI().length, 0, "actions are not messages");

/* --- the window stays bounded --- */
const bounded = new MemoryManager();
for (let i = 0; i < bounded.maxHistory + 10; i++) bounded.addMessage("user", `m${i}`);
assert.equal(bounded.getFormattedHistoryForAPI().length, bounded.maxHistory);
assert.equal(bounded.getChatHistory().at(-1).content, `m${bounded.maxHistory + 9}`, "newest messages are kept");

/* --- clear resets both views --- */
memory.clear();
assert.deepEqual(memory.getChatHistory(), []);
assert.deepEqual(memory.getFormattedHistoryForAPI(), []);

console.log("MemoryManager: all checks passed");

/* --- clear wipes both the conversation and the action log --- */
memory.clear();
assert.deepEqual(memory.getRecentActions(), [], "a cleared session must not carry old actions into the next prompt");
