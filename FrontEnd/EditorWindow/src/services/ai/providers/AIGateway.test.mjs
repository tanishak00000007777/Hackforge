// Run: npm test
//
// Multi-key failover: one exhausted daily quota must not stop the editor when
// another key or provider is configured.
import assert from "node:assert/strict";
import { AIGateway } from "./AIGateway.js";
import { AIProviderError, normalizeHttpError, parseRetrySeconds } from "./normalize.js";
import { buildCredentials, PROVIDER_DEFAULTS } from "./config.js";
import { toGeminiSchema, toGeminiTools, toGeminiContents } from "./gemini.js";

/* ---------------- error normalization ---------------- */

const groq429 = normalizeHttpError({
  status: 429,
  provider: "groq",
  body: { error: { message: "Rate limit reached ... on tokens per day (TPD): Limit 100000, Used 98202. Please try again in 36m32.8s." } },
  headers: new Map(),
});
assert.equal(groq429.kind, "quota", "a daily budget is a quota, not a transient limit");
assert.equal(groq429.perDay, true);
assert.equal(Math.round(groq429.retryAfterSeconds), 2193);
assert.ok(groq429.shouldFailover, "another key may still have budget");

const perMinute = normalizeHttpError({
  status: 429, provider: "groq",
  body: { error: { message: "on tokens per minute (TPM): Limit 12000. Please try again in 4.7s." } },
  headers: new Map(),
});
assert.equal(perMinute.kind, "rate_limit");
assert.equal(perMinute.perDay, false);

assert.equal(normalizeHttpError({ status: 401, provider: "x", body: {}, headers: new Map() }).kind, "auth");
assert.equal(normalizeHttpError({ status: 500, provider: "x", body: {}, headers: new Map() }).kind, "server");
assert.equal(normalizeHttpError({ status: 400, provider: "x", body: { error: { code: "tool_use_failed" } }, headers: new Map() }).kind, "tool_use_failed");

const badRequest = normalizeHttpError({ status: 400, provider: "x", body: { error: { message: "bad field" } }, headers: new Map() });
assert.equal(badRequest.kind, "bad_request");
assert.equal(badRequest.shouldFailover, false, "a malformed payload fails identically everywhere -- never burn other keys on it");

assert.equal(parseRetrySeconds("try again in 19m32.9s"), 1172.9);
assert.equal(parseRetrySeconds("nothing here"), null);

/* ---------------- failover ---------------- */

const fake = (id, behaviour) => ({
  id, provider: id, label: id, model: `${id}-model`,
  client: { name: id, send: behaviour },
});

const quotaError = () => { throw new AIProviderError({ kind: "quota", retryAfterSeconds: 3600, message: "out of quota" }); };
const answer = (text) => async () => ({ message: text, toolCalls: [], provider: "x", model: "m" });

// exhausted first key rolls to the second
let clock = 0;
const gateway = new AIGateway([fake("groq1", quotaError), fake("groq2", answer("second key"))], { now: () => clock });
assert.equal((await gateway.send({})).message, "second key");
assert.equal(gateway.status().find((s) => s.id === "groq1").available, false, "the spent key is put on cooldown");
assert.equal(gateway.status().find((s) => s.id === "groq2").available, true);

// the spent key is not tried again while cooling down
let groq1Calls = 0;
const counting = new AIGateway(
  [fake("groq1", async () => { groq1Calls++; quotaError(); }), fake("groq2", answer("ok"))],
  { now: () => clock },
);
await counting.send({});
await counting.send({});
assert.equal(groq1Calls, 1, "a cooling-down key must not be retried on every prompt");

// ...and is tried again once the cooldown expires
clock += 3_600_001;
await counting.send({});
assert.equal(groq1Calls, 2, "cooldown expiry puts the key back in rotation");

// a rejected credential is retired, not merely cooled
const authGateway = new AIGateway(
  [fake("bad", async () => { throw new AIProviderError({ kind: "auth", message: "bad key" }); }), fake("good", answer("fine"))],
  { now: () => clock },
);
assert.equal((await authGateway.send({})).message, "fine");
assert.equal(authGateway.status().find((s) => s.id === "bad").disabled, true);

// a deterministic error is NOT retried across keys
let attempts = 0;
const strict = new AIGateway(
  [fake("a", async () => { attempts++; throw new AIProviderError({ kind: "bad_request", message: "malformed" }); }), fake("b", answer("never"))],
  { now: () => clock },
);
await assert.rejects(() => strict.send({}), /malformed/);
assert.equal(attempts, 1, "only the first key is charged for our own bad payload");

// every key down: one clear error, carrying the shortest wait
const allDown = new AIGateway([fake("a", quotaError), fake("b", quotaError)], { now: () => clock });
await assert.rejects(() => allDown.send({}), (err) => err.kind === "quota");
await assert.rejects(() => allDown.send({}), (err) => err.retryAfterSeconds > 0);

// no configuration at all is an actionable message, not a crash. It names no
// provider or environment variable: an organizer cannot act on either, and the
// system prompt forbids leaking them.
await assert.rejects(() => new AIGateway([]).send({}), /HackForge AI is not configured/);
await assert.rejects(
  () => new AIGateway([]).send({}),
  (err) => !/groq|gemini|kimi|VITE_/i.test(err.message),
);

// a recovered key clears its noted state
const flaky = { calls: 0 };
const recovering = new AIGateway(
  [fake("f", async () => { flaky.calls++; if (flaky.calls === 1) quotaError(); return { message: "back", toolCalls: [] }; })],
  { now: () => clock },
);
await assert.rejects(() => recovering.send({}));
clock += 3_600_001;
assert.equal((await recovering.send({})).message, "back");
assert.equal(recovering.status()[0].available, true, "a working key has no leftover cooldown");

/* ---------------- configuration ---------------- */

const creds = buildCredentials({
  VITE_GROQ_API_KEY: "k1, k2",
  VITE_GEMINI_API_KEY: "g1",
  VITE_KIMI_API_KEY: "",
});
assert.deepEqual(creds.map((c) => c.id), ["groq#1", "groq#2", "gemini#1"], "each key is its own budget; blanks are skipped");
assert.equal(creds[0].model, PROVIDER_DEFAULTS.groq.model);
assert.equal(creds[2].provider, "gemini");
assert.ok(creds[0].label.includes("key 1"), "multiple keys are distinguishable in diagnostics");

assert.deepEqual(buildCredentials({}), [], "no keys means no credentials, not a broken object");
assert.deepEqual(
  buildCredentials({ VITE_GROQ_API_KEY: "YOUR_API_KEY_HERE" }),
  [],
  "the placeholder key must not count as configured",
);

const ordered = buildCredentials({ VITE_AI_PROVIDER_ORDER: "kimi,groq", VITE_GROQ_API_KEY: "a", VITE_KIMI_API_KEY: "b" });
assert.deepEqual(ordered.map((c) => c.provider), ["kimi", "groq"], "explicit order is honoured");

const custom = buildCredentials({ VITE_GROQ_API_KEY: "a", VITE_GROQ_MODEL: "llama-3.1-8b-instant" });
assert.equal(custom[0].model, "llama-3.1-8b-instant", "per-provider model override");

/* ---------------- Gemini translation ---------------- */

const schema = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["blank", "hero"], description: "Section type." },
    index: { type: "number" },
    items: { type: "array", items: { type: "string" } },
  },
  required: ["type"],
};
const converted = toGeminiSchema(schema);
assert.equal(converted.type, "OBJECT", "Gemini wants upper-case types");
assert.equal(converted.properties.type.type, "STRING");
assert.deepEqual(converted.properties.type.enum, ["blank", "hero"]);
assert.equal(converted.properties.items.items.type, "STRING", "array item schemas convert too");
assert.deepEqual(converted.required, ["type"]);

const declarations = toGeminiTools([
  { name: "createSection", description: "d", parameters: schema },
  { name: "getSelection", description: "d", parameters: { type: "object", properties: {} } },
])[0].functionDeclarations;
assert.equal(declarations[0].parameters.type, "OBJECT");
assert.equal(declarations[1].parameters, undefined, "Gemini rejects an OBJECT with no properties");
assert.equal(toGeminiTools([]), undefined, "no tools means no tools block");

const contents = toGeminiContents([
  { role: "system", content: "be brief" },
  { role: "user", content: "hello" },
  { role: "assistant", content: "hi" },
]);
assert.deepEqual(contents.map((c) => c.role), ["user", "model"], "no system role in contents");
assert.ok(contents[0].parts[0].text.includes("be brief"), "system text folds into the next user turn");
assert.ok(contents[0].parts[0].text.includes("hello"));

console.log("AIGateway: all checks passed");

/* --- a retired/ungranted model is a per-key problem, not a bad request ---
   Reported: a freshly added Gemini key looked "out of quota" because the
   default model 404'd and the gateway stopped instead of trying the next key. */
const modelGone = normalizeHttpError({
  status: 404, provider: "gemini",
  body: { error: { message: "models/gemini-1.5-flash is not found for API version v1beta" } },
  headers: new Map(),
});
assert.equal(modelGone.kind, "model_unavailable");
assert.ok(modelGone.shouldFailover, "another provider may still be usable");

const failover404 = new AIGateway(
  [
    fake("gemini", async () => { throw modelGone; }),
    fake("kimi", answer("kimi answered")),
  ],
  { now: () => clock },
);
assert.equal((await failover404.send({})).message, "kimi answered");
assert.equal(failover404.status().find((s) => s.id === "gemini").disabled, true, "waiting will not grant a model");

/* --- the failure summary names each credential, so the message is actionable --- */
const mixed = new AIGateway(
  [
    fake("groq", async () => { throw new AIProviderError({ kind: "quota", retryAfterSeconds: 2193, message: "TPD spent" }); }),
    fake("gemini", async () => { throw modelGone; }),
  ],
  { now: () => clock },
);
await assert.rejects(() => mixed.send({}));
const summary = mixed.failureSummary();
assert.ok(summary.includes("groq: quota spent"), `expected quota in: ${summary}`);
assert.ok(summary.includes("gemini: model unavailable"), `expected model reason in: ${summary}`);
assert.equal(new AIGateway([fake("ok", answer("y"))]).failureSummary(), "", "a healthy roster reports nothing");

/* --- the Gemini default must not be a pinned version that ages out --- */
assert.equal(PROVIDER_DEFAULTS.gemini.model, "gemini-flash-latest");

console.log("AIGateway model failover: all checks passed");
