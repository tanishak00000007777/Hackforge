import { AIProviderError } from "./normalize";

/**
 * Tries each configured credential in order until one answers.
 *
 * A quota or rate limit is a property of ONE key, not of the request, so the
 * same prompt is simply sent to the next credential. Deterministic failures
 * (a malformed payload) are not retried: every provider would reject them
 * identically, and retrying would just burn budgets.
 */
export class AIGateway {
  constructor(credentials = [], { now = () => Date.now() } = {}) {
    this.credentials = credentials;
    this.now = now;
    this.state = new Map(); // id -> { availableAt, disabled, reason }
  }

  get isConfigured() {
    return this.credentials.length > 0;
  }

  /** Credentials in preference order, skipping any cooling down or retired. */
  available() {
    const time = this.now();
    return this.credentials.filter((credential) => {
      const state = this.state.get(credential.id);
      if (!state) return true;
      if (state.disabled) return false;
      return !state.availableAt || state.availableAt <= time;
    });
  }

  /** Human-readable picture of every credential, for diagnostics and the UI. */
  status() {
    const time = this.now();
    return this.credentials.map((credential) => {
      const state = this.state.get(credential.id) || {};
      const cooldownMs = state.availableAt ? Math.max(0, state.availableAt - time) : 0;
      return {
        id: credential.id,
        label: credential.label,
        provider: credential.provider,
        model: credential.model,
        available: !state.disabled && cooldownMs === 0,
        disabled: !!state.disabled,
        cooldownSeconds: Math.ceil(cooldownMs / 1000),
        reason: state.reason || null,
      };
    });
  }

  #cooldown(credential, seconds, reason, kind) {
    this.state.set(credential.id, { availableAt: this.now() + seconds * 1000, reason, kind });
  }

  #disable(credential, reason, kind) {
    this.state.set(credential.id, { disabled: true, reason, kind });
  }

  /** "Groq: daily quota spent · Gemini (key 1): model unavailable" */
  failureSummary() {
    const readable = {
      quota: "quota spent",
      rate_limit: "rate limited",
      auth: "key rejected",
      model_unavailable: "model unavailable",
      server: "provider error",
      network: "unreachable",
    };
    return this.credentials
      .map((credential) => {
        const state = this.state.get(credential.id);
        if (!state) return null;
        return `${credential.label}: ${readable[state.kind] || "unavailable"}`;
      })
      .filter(Boolean)
      .join(" · ");
  }

  /**
   * Send one request. Returns the first provider's normalized response.
   * Throws the last error when every credential is unusable.
   */
  async send(request) {
    if (!this.isConfigured) {
      throw new AIProviderError({
        kind: "auth",
        message: "HackForge AI is not configured. Ask an administrator to configure an AI provider.",
      });
    }

    const candidates = this.available();
    if (!candidates.length) {
      const soonest = Math.min(
        ...this.credentials.map((credential) => {
          const state = this.state.get(credential.id) || {};
          return state.disabled ? Infinity : Math.max(0, (state.availableAt || 0) - this.now());
        }),
      );
      throw new AIProviderError({
        kind: Number.isFinite(soonest) ? "rate_limit" : "quota",
        retryAfterSeconds: Number.isFinite(soonest) ? Math.ceil(soonest / 1000) : null,
        message: Number.isFinite(soonest)
          ? "Every AI key is cooling down. Try again shortly."
          : "Every configured AI key is exhausted or rejected.",
      });
    }

    let lastError = null;

    for (const credential of candidates) {
      try {
        const result = await credential.client.send(request);
        // A key that works again clears whatever was noted against it.
        this.state.delete(credential.id);
        return { ...result, credentialId: credential.id, label: credential.label };
      } catch (error) {
        lastError = error instanceof AIProviderError ? error : new AIProviderError({ kind: "server", message: String(error?.message || error) });
        lastError.provider = lastError.provider || credential.provider;

        if (!lastError.shouldFailover) throw lastError; // same answer everywhere

        if (lastError.kind === "auth" || lastError.kind === "model_unavailable") {
          // Neither fixes itself by waiting: a bad key stays bad, and a model
          // this key cannot reach stays unreachable until configuration changes.
          this.#disable(credential, lastError.message, lastError.kind);
          console.warn(
            `[ai] ${credential.label} (${credential.model}) unusable: ${lastError.kind} — ${lastError.message}. Retiring it for this session.`,
          );
        } else {
          // Quota exhaustion often reports a long wait; a minute window a short
          // one. Either way, do not ask this key again until it expires.
          const wait = lastError.retryAfterSeconds ?? (lastError.kind === "quota" ? 3600 : 60);
          this.#cooldown(credential, wait, lastError.message, lastError.kind);
          console.warn(`[ai] ${credential.label} unavailable for ${Math.ceil(wait)}s (${lastError.kind}); trying the next key.`);
        }
      }
    }

    throw lastError;
  }
}
