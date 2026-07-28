import { normalizeHttpError, networkError, cleanMessages } from "./normalize";
import { recoverToolCalls } from "./recoverToolCall";

/**
 * Chat-completions adapter. Groq and Kimi (Moonshot) speak the same wire
 * format, so one implementation serves both -- only baseUrl and model differ.
 */
export function createOpenAICompatibleProvider({ name, baseUrl, apiKey, model, headers = {} }) {
  return {
    name,
    model,
    supportsTools: true,

    async send({ system, messages, tools, maxTokens, temperature, signal }) {
      const payload = {
        model,
        messages: [{ role: "system", content: system }, ...cleanMessages(messages)],
        temperature,
        max_tokens: maxTokens,
      };

      if (tools?.length) {
        payload.tools = tools.map((tool) => ({
          type: "function",
          function: { name: tool.name, description: tool.description, parameters: tool.parameters },
        }));
        payload.tool_choice = "auto";
      }

      let response;
      try {
        response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, ...headers },
          body: JSON.stringify(payload),
          signal,
        });
      } catch (cause) {
        throw networkError(name, cause);
      }

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const error = normalizeHttpError({ status: response.status, body, headers: response.headers, provider: name });

        // Llama models sometimes write the call as text; the provider rejects
        // it but the intent survives in `failed_generation`.
        if (error.kind === "tool_use_failed") {
          const recovered = recoverToolCalls(body?.error?.failed_generation);
          if (recovered.length) return { message: "", toolCalls: recovered, provider: name, model };
        }
        throw error;
      }

      const choice = body?.choices?.[0]?.message || {};
      const toolCalls = (choice.tool_calls || [])
        .map((call) => {
          try {
            return { id: call.id, name: call.function?.name, arguments: JSON.parse(call.function?.arguments || "{}") };
          } catch {
            console.warn(`[${name}] discarding tool call with unparseable arguments:`, call.function?.name);
            return null;
          }
        })
        .filter((call) => call && call.name);

      return { message: choice.content || "", toolCalls, provider: name, model };
    },
  };
}
