import { useIntegrationStore } from "@/store/integrationStore";
import { normalizeApiBase } from "@/services/hackforgeApi";

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 8_000;
const MAX_MESSAGE_AND_TOOL_CHARS = 60_000;

function fitHistoryToRequest(history, tools) {
  let remaining = Math.max(0, MAX_MESSAGE_AND_TOOL_CHARS - JSON.stringify(tools || []).length);
  const messages = [];

  for (let index = (history || []).length - 1; index >= 0 && messages.length < MAX_MESSAGES && remaining > 0; index--) {
    const { role, content } = history[index] || {};
    if (!["user", "assistant"].includes(role) || !content) continue;

    const fitted = String(content).slice(0, Math.min(MAX_MESSAGE_CHARS, remaining));
    if (!fitted) continue;
    messages.unshift({ role, content: fitted });
    remaining -= fitted.length;
  }

  return messages;
}

function responseError(body) {
  if (typeof body?.detail === "string") return body.detail;
  if (Array.isArray(body?.detail)) {
    const validation = body.detail.map((item) => item?.msg).filter(Boolean).join(" ");
    if (/context is too large|too long/i.test(validation)) {
      return "This AI conversation is too long. Clear the assistant chat and try again.";
    }
    return "The AI request was rejected. Refresh Studio and try again.";
  }
  return "The AI service could not complete that request.";
}

export class AIProvider {
  status() {
    return [{ id: "hackforge-ai", label: "HackForge AI", available: true }];
  }

  get model() {
    return "server-managed";
  }

  async sendPrompt(systemInstruction, history, tools = []) {
    const session = useIntegrationStore.getState().session;
    if (!session?.accessToken || !session?.hackathonId) {
      throw new Error("Studio session is not connected. Reopen the editor from your dashboard.");
    }

    let response;
    try {
      response = await fetch(`${normalizeApiBase(session.apiBaseUrl)}/ai/copilot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          hackathon_id: session.hackathonId,
          system: systemInstruction,
          messages: fitHistoryToRequest(history, tools),
          tools,
        }),
      });
    } catch {
      throw new Error("I couldn't reach the AI service. Please try again.");
    }

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(responseError(body));
    }

    return {
      message: body?.message || "",
      toolCalls: (body?.tool_calls || []).map((call) => ({
        id: call.id,
        name: call.name,
        arguments: call.arguments || {},
      })),
    };
  }
}


export const aiProvider = new AIProvider();
