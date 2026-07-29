import assert from "node:assert/strict";

if (!globalThis.localStorage) {
  const backing = new Map();
  globalThis.localStorage = {
    getItem: (key) => (backing.has(key) ? backing.get(key) : null),
    setItem: (key, value) => backing.set(key, String(value)),
    removeItem: (key) => backing.delete(key),
  };
}

const { AIProvider } = await import("./AIProvider.js");
const { useIntegrationStore } = await import("@/store/integrationStore");

useIntegrationStore.setState({
  session: {
    accessToken: "test-token",
    hackathonId: "00000000-0000-0000-0000-000000000001",
    apiBaseUrl: "http://127.0.0.1:8000/api/v1",
  },
});

const originalFetch = globalThis.fetch;
let sent;
globalThis.fetch = async (_url, options) => {
  sent = JSON.parse(options.body);
  return { ok: true, json: async () => ({ message: "ok", tool_calls: [] }) };
};

const history = Array.from({ length: 20 }, (_, index) => ({
  role: index % 2 ? "assistant" : "user",
  content: `${index}:` + "x".repeat(3_000),
}));
const tools = [{
  name: "generateTheme",
  description: "Generate a theme",
  parameters: { type: "object", properties: { baseColor: { type: "string" } } },
}];

await new AIProvider().sendPrompt("system", history, tools);
const contextChars = sent.messages.reduce((total, message) => total + message.content.length, 0)
  + JSON.stringify(tools).length;
assert.ok(contextChars <= 60_000, `request context exceeded backend limit: ${contextChars}`);
assert.ok(sent.messages.length <= 20);
assert.equal(sent.messages.at(-1).content, history.at(-1).content);

globalThis.fetch = async () => ({
  ok: false,
  json: async () => ({ detail: [{ msg: "Value error, AI request context is too large" }] }),
});
await assert.rejects(
  new AIProvider().sendPrompt("system", history, tools),
  /conversation is too long/i,
  "structured validation errors must not collapse to [object Object]",
);

globalThis.fetch = originalFetch;
console.log("AIProvider: all checks passed");
