// ===========================================
// PersonaForge API client (AI/personaforge FastAPI backend)
// Base URL: VITE_AI_API_URL, or same-origin (vite proxies /api in dev).
// ===========================================

const BASE = (import.meta.env?.VITE_AI_API_URL ?? "").replace(/\/+$/, "");

export const apiUrl = (path) => `${BASE}${path}`;

async function request(path, options) {
  let res;
  try {
    res = await fetch(apiUrl(path), options);
  } catch {
    throw new Error("Cannot reach the AI service. Is the PersonaForge backend running?");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `${res.status} ${res.statusText}`);
  }
  return res.json();
}

const postJson = (body) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const personaForge = {
  listProjects: () => request("/api/projects"),
  getProject: (id) => request(`/api/projects/${id}`),
  deleteProject: (id) => request(`/api/projects/${id}`, { method: "DELETE" }),

  // Accepts a single .zip or a whole folder; webkitRelativePath keeps the tree.
  uploadProject: (files) => {
    const form = new FormData();
    for (const file of files) form.append("files", file, file.webkitRelativePath || file.name);
    return request("/api/projects", { method: "POST", body: form });
  },

  listVersions: (id) => request(`/api/projects/${id}/versions`),
  restoreVersion: (id, number) => request(`/api/projects/${id}/versions/${number}/restore`, { method: "POST" }),

  personalise: (id, body) => request(`/api/projects/${id}/personalise`, postJson(body)),
  getJob: (jobId) => request(`/api/jobs/${jobId}`),
  approveJob: (jobId) => request(`/api/jobs/${jobId}/approve`, { method: "POST" }),
  rejectJob: (jobId) => request(`/api/jobs/${jobId}/reject`, { method: "POST" }),
  retryJob: (jobId) => request(`/api/jobs/${jobId}/retry`, { method: "POST" }),

  downloadUrl: (id, version) => apiUrl(`/api/projects/${id}/download${version ? `?version=${version}` : ""}`),
  versionPreviewUrl: (id, version, file) => apiUrl(`/api/projects/${id}/preview/${version}/${file}`),
  jobPreviewUrl: (jobId, file) => apiUrl(`/api/jobs/${jobId}/preview/${file}`),
};

export const JOB_PENDING_STATES = ["queued", "running"];

/**
 * Polls a job until it leaves queued/running, errors, or times out.
 * Sequential (not setInterval) so a slow backend never stacks requests.
 * Returns a cancel function; call it on unmount.
 */
export function pollJob(jobId, onUpdate, options = {}) {
  // Generous timeout: a job makes several LLM calls and may sit out a
  // tokens-per-minute window between them.
  const { intervalMs = 1500, timeoutMs = 15 * 60 * 1000, getJob = personaForge.getJob } = options;
  const deadline = Date.now() + timeoutMs;
  let cancelled = false;

  (async () => {
    while (!cancelled) {
      let job;
      try {
        job = await getJob(jobId);
      } catch (err) {
        if (!cancelled) onUpdate(null, err);
        return;
      }
      if (cancelled) return;

      onUpdate(job, null);
      if (!JOB_PENDING_STATES.includes(job.state)) return;

      if (Date.now() >= deadline) {
        onUpdate(null, new Error("Timed out waiting for the AI job to finish."));
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  })();

  return () => {
    cancelled = true;
  };
}
