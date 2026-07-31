import { createOpenAICompatibleProvider } from "./openaiCompatible";
import { createGeminiProvider } from "./gemini";

/**
 * Credentials come from the environment. Every provider accepts a
 * comma-separated list, so one exhausted key rolls to the next:
 *
 *   VITE_GROQ_API_KEY=key_one,key_two
 *   VITE_GEMINI_API_KEY=...
 *   VITE_KIMI_API_KEY=...
 *   VITE_AI_PROVIDER_ORDER=groq,gemini,kimi     (optional, this is the default)
 *   VITE_GROQ_MODEL=llama-3.3-70b-versatile     (optional per-provider override)
 */

export const PROVIDER_DEFAULTS = {
  groq: {
    label: "HackForge AI",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    create: createOpenAICompatibleProvider,
  },
  gemini: {
    label: "Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    // Alias that always resolves to a currently served flash model. Pinning an
    // exact version ages badly: gemini-1.5-flash now 404s, and 2.0-flash has a
    // separate (often exhausted) free-tier pool.
    model: "gemini-flash-latest",
    create: createGeminiProvider,
  },
  kimi: {
    label: "Kimi",
    baseUrl: "https://api.moonshot.ai/v1",
    model: "kimi-k2-0711-preview",
    create: createOpenAICompatibleProvider,
  },
};

const DEFAULT_ORDER = ["groq", "gemini", "kimi"];

const splitKeys = (value) =>
  String(value || "")
    .split(",")
    .map((key) => key.trim())
    .filter((key) => key && key !== "YOUR_API_KEY_HERE");

/**
 * Build the ordered credential list. Each entry is one provider + one key, so
 * two Groq keys give two independent budgets before falling through to Gemini.
 */
export function buildCredentials(env = {}) {
  const order = splitKeys(env.VITE_AI_PROVIDER_ORDER).length
    ? splitKeys(env.VITE_AI_PROVIDER_ORDER)
    : DEFAULT_ORDER;

  const credentials = [];

  for (const providerName of order) {
    const preset = PROVIDER_DEFAULTS[providerName];
    if (!preset) {
      console.warn(`Unknown AI provider '${providerName}' in VITE_AI_PROVIDER_ORDER; skipping.`);
      continue;
    }

    const upper = providerName.toUpperCase();
    const keys = splitKeys(env[`VITE_${upper}_API_KEY`]);
    const model = env[`VITE_${upper}_MODEL`]?.trim() || preset.model;
    const baseUrl = env[`VITE_${upper}_BASE_URL`]?.trim() || preset.baseUrl;

    keys.forEach((apiKey, index) => {
      credentials.push({
        id: `${providerName}#${index + 1}`,
        provider: providerName,
        label: keys.length > 1 ? `${preset.label} (key ${index + 1})` : preset.label,
        model,
        client: preset.create({ name: providerName, apiKey, model, baseUrl }),
      });
    });
  }

  return credentials;
}
