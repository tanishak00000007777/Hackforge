// Run: npm test
//
// Regression: Groq returned HTTP 400 tool_use_failed with
//   failed_generation: "<function=createSection{\"type\": \"blank\"}</function>"
// and the whole turn died with a raw API error shown to the user.
import assert from "node:assert/strict";
import { recoverToolCalls, extractFailedGeneration, isToolUseFailure } from "./recoverToolCall.js";

/* --- the exact reported payload --- */
const reported = '<function=createSection{"type": "blank"}</function>';
const [call] = recoverToolCalls(reported);
assert.equal(call.name, "createSection");
assert.deepEqual(call.arguments, { type: "blank" });
assert.ok(call.id, "a recovered call still needs an id");

/* --- the other shapes Llama models emit --- */
assert.deepEqual(recoverToolCalls('<function=updateColors>{"color":"#2563eb"}</function>')[0].arguments, { color: "#2563eb" });
assert.deepEqual(recoverToolCalls('<function name="deleteSection">{"sectionId":"abc"}</function>')[0].arguments, { sectionId: "abc" });
assert.equal(recoverToolCalls('<function name="deleteSection">{"sectionId":"abc"}</function>')[0].name, "deleteSection");

// <tool_call> nests the real arguments one level down
const nested = recoverToolCalls('<tool_call>{"name":"createPage","arguments":{"name":"About"}}</tool_call>')[0];
assert.equal(nested.name, "createPage");
assert.deepEqual(nested.arguments, { name: "About" });

/* --- nested braces and strings containing braces --- */
const complex = '<function=setResponsiveStyle{"breakpoint":"mobile","styles":{"fontSize":"32px","padding":"8px"}}</function>';
assert.deepEqual(recoverToolCalls(complex)[0].arguments, {
  breakpoint: "mobile",
  styles: { fontSize: "32px", padding: "8px" },
});

const braceInString = '<function=rewriteContent{"instruction":"use a { brace } literally"}</function>';
assert.deepEqual(recoverToolCalls(braceInString)[0].arguments, { instruction: "use a { brace } literally" });

const escaped = '<function=rewriteContent{"instruction":"say \\"hi\\" politely"}</function>';
assert.equal(recoverToolCalls(escaped)[0].arguments.instruction, 'say "hi" politely');

/* --- several calls in one generation --- */
const multi = '<function=createSection{"type":"blank"}</function><function=createElement{"type":"heading"}</function>';
assert.deepEqual(recoverToolCalls(multi).map((c) => c.name), ["createSection", "createElement"]);

/* --- nothing recoverable returns nothing, rather than inventing a call --- */
assert.deepEqual(recoverToolCalls(""), []);
assert.deepEqual(recoverToolCalls(null), []);
assert.deepEqual(recoverToolCalls("I will add a section for you."), []);
assert.deepEqual(recoverToolCalls("<function=createSection{not json}</function>"), [], "unparseable args must not be guessed");
assert.deepEqual(recoverToolCalls("<function=createSection"), [], "truncated output must not be guessed");
assert.deepEqual(recoverToolCalls('<function=createSection["a"]</function>'), [], "arrays are not argument objects");

/* --- reading the payload out of the error the SDK throws --- */
const sdkError = {
  status: 400,
  error: { error: { code: "tool_use_failed", failed_generation: reported } },
  message: "400 tool_use_failed",
};
assert.ok(isToolUseFailure(sdkError));
assert.equal(extractFailedGeneration(sdkError), reported);

// older SDKs only put the body in the message string
const stringOnly = {
  status: 400,
  message: `400 {"error":{"message":"Failed to call a function.","type":"invalid_request_error","code":"tool_use_failed","failed_generation":"<function=createSection{\\"type\\": \\"blank\\"}</function>"}}`,
};
assert.ok(isToolUseFailure(stringOnly));
const fromMessage = extractFailedGeneration(stringOnly);
assert.ok(fromMessage.includes("createSection"), "must dig the payload out of the message");
assert.deepEqual(recoverToolCalls(fromMessage)[0].arguments, { type: "blank" });

// unrelated errors are left alone
assert.equal(isToolUseFailure({ status: 429, message: "rate limit" }), false);
assert.equal(extractFailedGeneration({ message: "network down" }), null);

console.log("recoverToolCall: all checks passed");

/* --- 429s: a per-minute window and a spent daily quota need different advice --- */
import { readRateLimit } from "./recoverToolCall.js";

const tpm = { status: 429, error: { error: { message: "Rate limit reached for model `llama-3.3-70b-versatile` on tokens per minute (TPM): Limit 12000, Used 11000, Requested 4000. Please try again in 4.745s." } } };
assert.equal(readRateLimit(tpm).seconds, 4.745, "the wait comes from the body");
assert.equal(readRateLimit(tpm).perDay, false, "a per-minute window is not a daily quota");

const tpd = { status: 429, error: { error: { message: "Rate limit reached on tokens per day (TPD): Limit 100000. Please try again in 19m32.9s." } } };
assert.equal(readRateLimit(tpd).perDay, true, "TPD must be reported as a daily quota");
assert.equal(readRateLimit(tpd).seconds, 1172.9, "minutes and seconds are both parsed");

// a long wait implies a daily budget even when the text does not say so
assert.equal(readRateLimit({ status: 429, error: { error: { message: "try again in 40m0s" } } }).perDay, true);

// the Retry-After header wins when present
assert.equal(readRateLimit({ status: 429, headers: { "retry-after": "12" }, error: {} }).seconds, 12);

// nothing to parse: report no wait rather than inventing one
assert.deepEqual(readRateLimit({ status: 429, error: {} }), { seconds: null, perDay: false });

console.log("readRateLimit: all checks passed");
