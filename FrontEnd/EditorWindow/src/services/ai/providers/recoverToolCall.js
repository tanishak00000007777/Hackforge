/**
 * Llama models on Groq sometimes emit a tool call as TEXT in Llama's own
 * syntax instead of a structured tool_call:
 *
 *   <function=createSection{"type": "blank"}</function>
 *
 * Groq's server fails to parse that and returns HTTP 400 with code
 * "tool_use_failed", putting the raw text in `failed_generation`. The call the
 * model wanted is fully recoverable from that string, so a malformed emission
 * becomes a normal tool call rather than a dead turn.
 */

/** Pull the JSON object starting at `from` by balancing braces (strings aware). */
function readJsonObject(text, from) {
  const start = text.indexOf("{", from);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (escaped) { escaped = false; continue; }
    if (char === "\\") { escaped = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth === 0) return { raw: text.slice(start, i + 1), end: i + 1 };
    }
  }
  return null;
}

// Covers the shapes seen from Llama models: <function=name{...}>,
// <function=name>{...}, <function name="name">{...}, and <tool_call>{...}.
const NAME_PATTERNS = [
  /<function\s*=\s*"?([a-zA-Z_][\w-]*)"?/g,
  /<function\s+name\s*=\s*"([a-zA-Z_][\w-]*)"/g,
  /<tool_call>\s*\{\s*"name"\s*:\s*"([a-zA-Z_][\w-]*)"/g,
];

/**
 * Extract every tool call from a failed generation.
 * Returns [{ id, name, arguments }] -- empty when nothing is recoverable.
 */
export function recoverToolCalls(failedGeneration) {
  if (typeof failedGeneration !== "string" || !failedGeneration.trim()) return [];

  const found = [];

  for (const pattern of NAME_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(failedGeneration)) !== null) {
      const name = match[1];
      const json = readJsonObject(failedGeneration, match.index + match[0].length);
      if (!json) continue;

      let parsed;
      try {
        parsed = JSON.parse(json.raw);
      } catch {
        continue; // unparseable args: better to skip than to invent them
      }

      // <tool_call>{"name":"x","arguments":{...}} nests the real arguments.
      const args = parsed && typeof parsed === "object" && parsed.name === name && parsed.arguments
        ? parsed.arguments
        : parsed;

      if (args && typeof args === "object" && !Array.isArray(args)) {
        found.push({ id: `recovered_${found.length}_${name}`, name, arguments: args });
      }
    }
    if (found.length) break; // first pattern that matches wins
  }

  return found;
}

/** Groq surfaces the raw text in different places depending on SDK version. */
export function extractFailedGeneration(error) {
  const body = error?.error?.error || error?.error || {};
  if (typeof body.failed_generation === "string") return body.failed_generation;

  // Fall back to digging it out of the stringified message.
  const message = String(error?.message || "");
  const start = message.indexOf('"failed_generation"');
  if (start === -1) return null;

  try {
    const jsonStart = message.indexOf("{");
    return JSON.parse(message.slice(jsonStart))?.error?.failed_generation ?? null;
  } catch {
    const match = message.match(/"failed_generation"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    return match ? JSON.parse(`"${match[1]}"`) : null;
  }
}

/**
 * How long to wait after a 429, and whether it is a per-minute window or the
 * daily quota. Groq puts "try again in 4.7s" / "in 19m32s" in the body and a
 * Retry-After header; the message also names which budget was hit (TPM/TPD).
 */
export function readRateLimit(error) {
  const body = error?.error?.error || error?.error || {};
  const text = `${body.message || ""} ${error?.message || ""}`;
  const header = error?.headers?.get?.("retry-after") ?? error?.headers?.["retry-after"];

  let seconds = null;
  if (header && !Number.isNaN(Number(header))) seconds = Number(header);

  if (seconds === null) {
    const match = text.match(/try again in (?:(\d+)m)?([\d.]+)s/i);
    if (match) seconds = Number(match[1] || 0) * 60 + Number(match[2]);
  }

  const perDay = /per day|\bTPD\b|\bRPD\b/i.test(text) || (seconds !== null && seconds > 300);
  return { seconds, perDay };
}

export const isToolUseFailure = (error) =>
  (error?.error?.error?.code || error?.error?.code) === "tool_use_failed" ||
  String(error?.message || "").includes("tool_use_failed");
