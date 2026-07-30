import { useIntegrationStore } from "@/store/integrationStore";
import { normalizeApiBase } from "@/services/hackforgeApi";


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
          messages: (history || []).map(
            ({ role, content, tool_calls, tool_call_id, name }) => {
              const message = {
                role,
                content: content || "",
              };

              if (tool_calls?.length) {
                message.tool_calls = tool_calls;
              }

              if (tool_call_id) {
                message.tool_call_id = tool_call_id;
              }

              if (name) {
                message.name = name;
              }

              return message;
            }
          ),
          tools,
        }),
      });
    } catch {
      throw new Error("I couldn't reach the AI service. Please try again.");
    }

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.detail || "The AI service could not complete that request.");
    }

    return {
      message: body?.message || "",
      toolCalls: (body?.tool_calls || []).map((call) => ({
        id: call.id,
        name: call.name,
        arguments: call.arguments || {},
        thought_signature: call.thought_signature || null,
      })),
    };
  }
}


export const aiProvider = new AIProvider();
