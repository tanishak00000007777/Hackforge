/**
 * One shape for every provider, so the rest of the app never learns which
 * vendor answered.
 *
 *   response: { message: string, toolCalls: [{ id, name, arguments }], provider, model }
 *   error:    AIProviderError { kind, status, retryAfterSeconds, perDay, message }
 *
 * `kind` is what the gateway routes on:
 *   auth          credential is bad -- retire it for the session
 *   quota         budget exhausted for a long window -- try someone else
 *   rate_limit    short window -- try someone else, come back later
 *   server        provider fault -- try someone else
 *   network       unreachable -- try someone else
 *   bad_request   our payload is wrong -- every provider will reject it
 *   tool_use_failed  model emitted a malformed call -- recoverable in place
 */

/**
 * `model_unavailable` belongs here: a retired or ungranted model is a problem
 * with ONE credential's configuration, not with the request, so the next
 * provider deserves a try.
 */
export const FAILOVER_KINDS = new Set([
  "auth", "quota", "rate_limit", "server", "network", "model_unavailable",
]);

export class AIProviderError extends Error {
  constructor({ kind, status = null, retryAfterSeconds = null, perDay = false, message, provider = null, raw = null }) {
    super(message);
    this.name = "AIProviderError";
    this.kind = kind;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
    this.perDay = perDay;
    this.provider = provider;
    this.raw = raw;
  }

  get shouldFailover() {
    return FAILOVER_KINDS.has(this.kind);
  }
}

/** "try again in 19m32.9s" / "in 4.745s" -> seconds */
export function parseRetrySeconds(text) {
  const match = String(text || "").match(/try again in (?:(\d+)m)?([\d.]+)s/i);
  if (!match) return null;
  return Number(match[1] || 0) * 60 + Number(match[2]);
}

/**
 * Turn any provider's HTTP failure into the common error.
 * `body` is the parsed JSON response (or null), `headers` the Response headers.
 */
export function normalizeHttpError({ status, body, headers, provider }) {
  const detail = body?.error?.message || body?.message || body?.error?.status || "";
  const code = body?.error?.code || body?.error?.type || "";
  const text = `${detail} ${code}`;

  const headerRetry = Number(headers?.get?.("retry-after"));
  const retryAfterSeconds = Number.isFinite(headerRetry) && headerRetry > 0 ? headerRetry : parseRetrySeconds(detail);

  const base = { status, retryAfterSeconds, provider, raw: body, message: detail || `HTTP ${status}` };

  if (status === 401 || status === 403) {
    return new AIProviderError({ ...base, kind: "auth", message: detail || "Credential rejected." });
  }

  if (status === 429) {
    // A per-day budget and a per-minute window need different handling: one is
    // worth waiting out, the other means use a different credential today.
    const perDay = /per day|\bTPD\b|\bRPD\b|quota/i.test(text) || (retryAfterSeconds !== null && retryAfterSeconds > 300);
    return new AIProviderError({ ...base, kind: perDay ? "quota" : "rate_limit", perDay });
  }

  if (status === 400 && /tool_use_failed/i.test(text)) {
    return new AIProviderError({ ...base, kind: "tool_use_failed" });
  }

  if (status === 404 || /not found for API version|is not supported|model.*not exist/i.test(text)) {
    return new AIProviderError({
      ...base,
      kind: "model_unavailable",
      message: detail || "The configured model is not available for this key.",
    });
  }

  if (status === 400 || status === 413 || status === 422) {
    return new AIProviderError({ ...base, kind: "bad_request" });
  }

  if (status >= 500) return new AIProviderError({ ...base, kind: "server" });

  return new AIProviderError({ ...base, kind: "server" });
}

export const networkError = (provider, cause) =>
  new AIProviderError({
    kind: "network",
    provider,
    message: `Could not reach ${provider}: ${cause?.message || cause}`,
    raw: cause,
  });

/** Messages are trimmed to role+content: extra fields get whole requests rejected. */
export const cleanMessages = (messages) =>
  (messages || [])
    .map(({ role, content }) => ({ role, content }))
    .filter((message) => message.content);
