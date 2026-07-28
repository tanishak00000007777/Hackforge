import { normalizeHttpError, networkError } from "./normalize";

/**
 * Google Generative Language adapter.
 *
 * Gemini differs from the chat-completions shape in four ways, all handled
 * here so the gateway sees the same result as any other provider:
 *   - the system prompt is `systemInstruction`, not a message
 *   - roles are "user" / "model", and there is no system role in contents
 *   - tools are `functionDeclarations`, and a parameterless tool must omit
 *     `parameters` entirely rather than send an empty object
 *   - a call comes back as a `functionCall` part, with args already parsed
 */

const DEFAULT_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** JSON Schema subset Gemini accepts: no $schema, no unknown keywords. */
export function toGeminiSchema(schema) {
  if (!schema || typeof schema !== "object") return undefined;

  const out = {};
  if (schema.type) out.type = String(schema.type).toUpperCase();
  if (schema.description) out.description = schema.description;
  if (schema.enum) out.enum = schema.enum.map(String);

  if (schema.properties) {
    const properties = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      const converted = toGeminiSchema(value);
      if (converted) properties[key] = converted;
    }
    // Gemini rejects an OBJECT with an empty properties map.
    if (Object.keys(properties).length) out.properties = properties;
  }

  if (schema.items) out.items = toGeminiSchema(schema.items);
  if (schema.required?.length) out.required = [...schema.required];

  return out;
}

export function toGeminiTools(tools) {
  const declarations = (tools || []).map((tool) => {
    const parameters = toGeminiSchema(tool.parameters);
    const declaration = { name: tool.name, description: tool.description };
    // Omit entirely when the tool takes no arguments.
    if (parameters?.properties) declaration.parameters = parameters;
    return declaration;
  });
  return declarations.length ? [{ functionDeclarations: declarations }] : undefined;
}

/** Chat history -> Gemini contents. System turns fold into the next user turn. */
export function toGeminiContents(messages) {
  const contents = [];
  let pendingSystem = "";

  for (const { role, content } of messages || []) {
    if (!content) continue;
    if (role === "system") { pendingSystem += `${content}\n`; continue; }

    const text = pendingSystem ? `${pendingSystem}${content}` : content;
    pendingSystem = "";
    contents.push({ role: role === "assistant" ? "model" : "user", parts: [{ text }] });
  }

  if (pendingSystem) contents.push({ role: "user", parts: [{ text: pendingSystem.trim() }] });
  return contents;
}

export function createGeminiProvider({ name = "gemini", apiKey, model, baseUrl = DEFAULT_BASE }) {
  return {
    name,
    model,
    supportsTools: true,

    async send({ system, messages, tools, maxTokens, temperature, signal }) {
      const payload = {
        systemInstruction: { parts: [{ text: system }] },
        contents: toGeminiContents(messages),
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      };

      const geminiTools = toGeminiTools(tools);
      if (geminiTools) payload.tools = geminiTools;

      let response;
      try {
        response = await fetch(`${baseUrl.replace(/\/$/, "")}/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify(payload),
          signal,
        });
      } catch (cause) {
        throw networkError(name, cause);
      }

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw normalizeHttpError({ status: response.status, body, headers: response.headers, provider: name });
      }

      const parts = body?.candidates?.[0]?.content?.parts || [];
      const message = parts.filter((part) => part.text).map((part) => part.text).join("").trim();

      const toolCalls = parts
        .filter((part) => part.functionCall?.name)
        .map((part, index) => ({
          id: `gemini_${index}_${part.functionCall.name}`,
          name: part.functionCall.name,
          arguments: part.functionCall.args || {},
        }));

      return { message, toolCalls, provider: name, model };
    },
  };
}
