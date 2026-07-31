export function normalizeApiBase(value) {
  return String(value || "/api/v1").replace(/\/+$/, "");
}

async function request(session, path, options = {}) {
  const response = await fetch(`${normalizeApiBase(session.apiBaseUrl)}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.detail || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function getManagedHackathon(session) {
  const owned = await request(session, "/hackathons/mine/owned");
  const hackathon = owned.find((item) => item.id === session.hackathonId);
  if (!hackathon) {
    const notFound = new Error("Hackathon not found");
    notFound.status = 404;
    throw notFound;
  }
  return hackathon;
}

export function saveWebsiteConfig(session, project) {
  return request(session, `/hackathons/${session.hackathonId}/website-config`, {
    method: "PATCH",
    body: JSON.stringify(project),
  });
}

export function publishHackathon(session) {
  return request(session, `/hackathons/${session.hackathonId}/publish`, {
    method: "POST",
  });
}

/** Append one AI Copilot conversation turn. Never throws to the caller --
 * see saveAiMessage in MemoryManager.js: a persistence failure must not
 * break the live chat. */
export function saveAiMessage(session, message) {
  return request(session, `/ai/conversations/${session.hackathonId}/messages`, {
    method: "POST",
    body: JSON.stringify(message),
  });
}

/** Full AI Copilot history for this hackathon, oldest first. */
export function getAiConversationHistory(session) {
  return request(session, `/ai/conversations/${session.hackathonId}/messages`);
}

export function listVersions(session) {
  return request(session, `/hackathons/${session.hackathonId}/versions`);
}

export function createVersion(session, body) {
  return request(session, `/hackathons/${session.hackathonId}/versions`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Unlike the list rows, this carries the full project document. */
export function getVersion(session, versionId) {
  return request(session, `/hackathons/${session.hackathonId}/versions/${versionId}`);
}

export function restoreVersion(session, versionId) {
  return request(session, `/hackathons/${session.hackathonId}/versions/${versionId}/restore`, {
    method: "POST",
  });
}
