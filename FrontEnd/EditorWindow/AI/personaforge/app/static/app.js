async function api(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || "Request failed");
  }
  return res.json();
}

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// ---------- Dashboard ----------

async function loadDashboard() {
  wireUploadForm();
  await refreshProjects();
}

async function refreshProjects() {
  const list = document.getElementById("project-list");
  const projects = await api("/api/projects");
  list.innerHTML = "";
  for (const p of projects) {
    list.appendChild(el(`
      <tr>
        <td>${p.name}</td>
        <td>${p.entry_file}</td>
        <td>${p.page_count}</td>
        <td>${p.html_count}</td>
        <td>${p.css_count}</td>
        <td>${p.js_count}</td>
        <td>v${p.current_version}</td>
        <td>
          <a class="button-link" href="/projects/${p.id}"><button type="button">Open</button></a>
          <button type="button" data-delete="${p.id}">Delete</button>
        </td>
      </tr>
    `));
  }
  list.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await api(`/api/projects/${btn.dataset.delete}`, { method: "DELETE" });
      refreshProjects();
    });
  });
}

function wireUploadForm() {
  const form = document.getElementById("upload-form");
  if (form.dataset.wired) return;   // attach exactly once
  form.dataset.wired = "1";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById("upload-folder");
    const status = document.getElementById("upload-status");
    if (!fileInput.files.length) {
      status.textContent = "Please choose a project folder first.";
      return;
    }
    const formData = new FormData();
    for (const file of fileInput.files) {
      // webkitRelativePath preserves the folder structure (e.g. "myproject/css/style.css")
      formData.append("files", file, file.webkitRelativePath || file.name);
    }
    status.textContent = `Uploading ${fileInput.files.length} file(s) and analysing...`;
    try {
      const result = await api("/api/projects", { method: "POST", body: formData });
      status.textContent = "Uploaded.";
      window.location.href = `/projects/${result.project_id}`;
    } catch (err) {
      status.textContent = `Error: ${err.message}`;
    }
  });
}

// ---------- Project page ----------

let pollTimer = null;

async function loadProjectPage() {
  const projectId = document.getElementById("project-id").value;
  await renderProjectSummary(projectId);
  await renderVersions(projectId);

  document.getElementById("submit-prompt").addEventListener("click", () => submitPrompt(projectId));
  document.querySelectorAll(".preview-tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".preview-tabs button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const width = btn.dataset.vp + "px";
      document.getElementById("preview-before").style.maxWidth = width;
      document.getElementById("preview-after").style.maxWidth = width;
    });
  });
}

async function renderProjectSummary(projectId) {
  const project = await api(`/api/projects/${projectId}`);
  const m = project.manifest;
  document.getElementById("project-summary").innerHTML = `
    <h1>${project.name}</h1>
    <p class="muted">Entry: ${project.entry_file} &middot; Version ${project.current_version}</p>
    <p>Pages: ${m.pages.length} &middot; Components: ${m.components.length} &middot; Protected IDs: ${m.protected_ids.length}</p>
    <a class="button-link" href="/api/projects/${projectId}/download"><button type="button">Download Latest</button></a>
  `;
}

async function renderVersions(projectId) {
  const versions = await api(`/api/projects/${projectId}/versions`);
  const list = document.getElementById("version-list");
  list.innerHTML = "";
  for (const v of versions.slice().reverse()) {
    list.appendChild(el(`
      <li>
        v${v.number} &mdash; ${v.summary || "no summary"}
        <a href="/api/projects/${projectId}/download?version=${v.number}">download</a>
        <button type="button" data-restore="${v.number}">Restore</button>
      </li>
    `));
  }
  list.querySelectorAll("[data-restore]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await api(`/api/projects/${projectId}/versions/${btn.dataset.restore}/restore`, { method: "POST" });
      window.location.reload();
    });
  });
}

async function submitPrompt(projectId) {
  const prompt = document.getElementById("prompt-input").value.trim();
  if (!prompt) return;
  const body = {
    prompt,
    preserve_layout: document.getElementById("preserve-layout").checked,
    allow_component_addition: document.getElementById("allow-add").checked,
    allow_component_removal: document.getElementById("allow-remove").checked,
    allow_javascript_edits: document.getElementById("allow-js").checked,
    max_files_to_change: parseInt(document.getElementById("max-files").value, 10) || 8,
  };
  const { job_id } = await api(`/api/projects/${projectId}/personalise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  document.getElementById("job-panel").hidden = false;
  document.getElementById("job-review").hidden = true;
  document.getElementById("job-error").hidden = true;
  pollJob(job_id, projectId);
}

function pollJob(jobId, projectId) {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    const job = await api(`/api/jobs/${jobId}`);
    document.getElementById("job-stage").textContent = `${job.state} - ${job.stage}`;

    if (job.state === "failed") {
      clearInterval(pollTimer);
      const errBox = document.getElementById("job-error");
      errBox.hidden = false;
      errBox.textContent = job.error_message;
      return;
    }
    if (job.state === "needs_review") {
      clearInterval(pollTimer);
      renderJobReview(job, jobId, projectId);
    }
  }, 1500);
}

function renderJobReview(job, jobId, projectId) {
  document.getElementById("job-review").hidden = false;
  document.getElementById("validation-summary").textContent = job.validation_result.passed
    ? "Passed validation."
    : `${job.validation_result.errors.length} unresolved issue(s): ${job.validation_result.errors.join("; ")}`;

  const filesList = document.getElementById("changed-files-list");
  filesList.innerHTML = "";
  for (const f of job.changed_files) filesList.appendChild(el(`<li>${f}</li>`));

  const before = document.getElementById("preview-before");
  const after = document.getElementById("preview-after");
  api(`/api/projects/${projectId}`).then(p => {
    before.src = `/api/projects/${projectId}/preview/${p.current_version}/${p.entry_file}`;
  });
  after.src = `/api/jobs/${jobId}/preview/index.html`;

  const diffView = document.getElementById("diff-view");
  diffView.innerHTML = "";
  for (const d of job.diffs) {
    diffView.appendChild(el(`<h4>${d.file} (+${d.additions} / -${d.deletions})</h4>`));
    const pre = document.createElement("pre");
    pre.className = "diff";
    pre.textContent = d.unified_diff;
    diffView.appendChild(pre);
  }

  document.getElementById("approve-btn").onclick = async () => {
    await api(`/api/jobs/${jobId}/approve`, { method: "POST" });
    window.location.reload();
  };
  document.getElementById("reject-btn").onclick = async () => {
    await api(`/api/jobs/${jobId}/reject`, { method: "POST" });
    document.getElementById("job-panel").hidden = true;
  };
  document.getElementById("retry-btn").onclick = async () => {
    const { job_id } = await api(`/api/jobs/${jobId}/retry`, { method: "POST" });
    document.getElementById("job-review").hidden = true;
    pollJob(job_id, projectId);
  };
}
