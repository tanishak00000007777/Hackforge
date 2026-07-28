import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle, ArrowLeft, Check, Download, FolderUp, Loader2, RotateCcw,
  Sparkles, Trash2, Wand2, X,
} from "lucide-react";
import { personaForge, pollJob, JOB_PENDING_STATES } from "@/services/ai/personaForgeClient";

const STAGE_LABELS = {
  queued: "Queued",
  understanding_request: "Understanding your request",
  selecting_relevant_components: "Selecting relevant components",
  planning_changes: "Planning changes",
  generating_edits: "Generating edits",
  applying_modifications: "Applying modifications",
  validating_website: "Validating the website",
  repairing_issues: "Repairing issues",
  generating_preview: "Generating preview",
  completed: "Completed",
};

const VIEWPORTS = [
  { label: "Mobile", width: 375 },
  { label: "Tablet", width: 768 },
  { label: "Desktop", width: 1440 },
];

const DEFAULT_SETTINGS = {
  preserve_layout: true,
  allow_component_addition: true,
  allow_component_removal: true,
  allow_javascript_edits: false,
  max_files_to_change: 8,
};

const errorText = (err) => err?.message || String(err);

export default function AIEditorModal({ isOpen, onClose }) {
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [versions, setVersions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [prompt, setPrompt] = useState("");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [job, setJob] = useState(null);
  const [jobError, setJobError] = useState(null);
  const [viewport, setViewport] = useState(VIEWPORTS[2].width);

  const cancelPollRef = useRef(null);

  const stopPolling = useCallback(() => {
    cancelPollRef.current?.();
    cancelPollRef.current = null;
  }, []);

  const watchJob = useCallback((jobId) => {
    stopPolling();
    setJobError(null);
    setJob({ id: jobId, state: "queued", stage: "queued" });
    cancelPollRef.current = pollJob(jobId, (next, err) => {
      if (err) return setJobError(errorText(err));
      setJob(next);
      if (next.state === "failed") setJobError(next.error_message || "The AI job failed.");
    });
  }, [stopPolling]);

  const refreshProjects = useCallback(async () => {
    setBusy(true);
    try {
      setProjects(await personaForge.listProjects());
      setError(null);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const openProject = useCallback(async (projectId) => {
    setBusy(true);
    try {
      const [detail, history] = await Promise.all([
        personaForge.getProject(projectId),
        personaForge.listVersions(projectId),
      ]);
      setProject(detail);
      setVersions(history);
      setError(null);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) refreshProjects();
  }, [isOpen, refreshProjects]);

  useEffect(() => stopPolling, [stopPolling]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isRunning = job ? JOB_PENDING_STATES.includes(job.state) : false;
  const inReview = job?.state === "needs_review";

  const backToProjects = () => {
    stopPolling();
    setProject(null);
    setJob(null);
    setJobError(null);
    setPrompt("");
    refreshProjects();
  };

  const handleUpload = async (fileList) => {
    if (!fileList?.length) return;
    setBusy(true);
    try {
      const { project_id } = await personaForge.uploadProject(fileList);
      await openProject(project_id);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (projectId) => {
    setBusy(true);
    try {
      await personaForge.deleteProject(projectId);
      await refreshProjects();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const submitPrompt = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isRunning) return;
    try {
      const { job_id } = await personaForge.personalise(project.id, { prompt: prompt.trim(), ...settings });
      watchJob(job_id);
    } catch (err) {
      setJobError(errorText(err));
    }
  };

  const approve = async () => {
    try {
      await personaForge.approveJob(job.id);
      setJob(null);
      setPrompt("");
      await openProject(project.id);
    } catch (err) {
      setJobError(errorText(err));
    }
  };

  const reject = async () => {
    try {
      await personaForge.rejectJob(job.id);
    } catch (err) {
      setJobError(errorText(err));
    }
    setJob(null);
  };

  const retry = async () => {
    try {
      const { job_id } = await personaForge.retryJob(job.id);
      watchJob(job_id);
    } catch (err) {
      setJobError(errorText(err));
    }
  };

  const restore = async (number) => {
    try {
      await personaForge.restoreVersion(project.id, number);
      await openProject(project.id);
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI Editing"
      className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <div className="bg-white w-full max-w-6xl h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 text-white shrink-0">
          <div className="flex items-center gap-3">
            {project && (
              <button onClick={backToProjects} className="p-1.5 rounded-lg hover:bg-white/20 transition" aria-label="Back to projects">
                <ArrowLeft size={18} />
              </button>
            )}
            <Sparkles size={18} />
            <div>
              <h2 className="font-semibold leading-tight">AI Editing</h2>
              <p className="text-[11px] opacity-80 leading-tight">
                {project ? `${project.name} · ${project.entry_file} · v${project.current_version}` : "Personalise a website with a prompt"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {project && (
              <a
                href={personaForge.downloadUrl(project.id)}
                className="text-xs font-semibold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
              >
                <Download size={14} /> Download latest
              </a>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition" aria-label="Close AI Editing">
              <X size={18} />
            </button>
          </div>
        </div>

        {error && <Banner tone="error" onDismiss={() => setError(null)}>{error}</Banner>}

        {!project ? (
          <ProjectPicker
            projects={projects}
            busy={busy}
            onOpen={openProject}
            onDelete={handleDelete}
            onUpload={handleUpload}
          />
        ) : (
          <div className="flex-1 grid grid-cols-[360px_1fr] overflow-hidden">
            {/* Prompt + versions */}
            <div className="border-r border-slate-100 overflow-y-auto p-5 space-y-6 bg-slate-50/60">
              <form onSubmit={submitPrompt} className="space-y-3">
                <label htmlFor="ai-prompt" className="text-sm font-semibold text-slate-800">Describe the changes</label>
                <textarea
                  id="ai-prompt"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Make the hero speak to enterprise buyers and switch the palette to deep blue."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[13px] outline-none focus:border-violet-500 transition resize-y"
                />

                <details className="text-[13px] text-slate-600">
                  <summary className="cursor-pointer font-medium text-slate-700">Advanced settings</summary>
                  <div className="mt-3 space-y-2">
                    <Toggle label="Preserve layout" name="preserve_layout" settings={settings} setSettings={setSettings} />
                    <Toggle label="Allow adding components" name="allow_component_addition" settings={settings} setSettings={setSettings} />
                    <Toggle label="Allow removing components" name="allow_component_removal" settings={settings} setSettings={setSettings} />
                    <Toggle label="Allow JavaScript edits" name="allow_javascript_edits" settings={settings} setSettings={setSettings} />
                    <label className="flex items-center justify-between gap-2">
                      Max files to change
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={settings.max_files_to_change}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, max_files_to_change: Math.min(50, Math.max(1, Number(e.target.value) || 1)) }))
                        }
                        className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-right outline-none focus:border-violet-500"
                      />
                    </label>
                  </div>
                </details>

                <button
                  type="submit"
                  disabled={!prompt.trim() || isRunning}
                  className="w-full bg-[#2B0A5A] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#1d0342] disabled:opacity-50 disabled:hover:bg-[#2B0A5A] transition flex items-center justify-center gap-2"
                >
                  {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                  {isRunning ? "Generating..." : "Generate changes"}
                </button>
              </form>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Version history</h3>
                <ul className="space-y-2">
                  {versions.slice().reverse().map((v) => (
                    <li key={v.number} className="bg-white border border-slate-200 rounded-xl p-3 text-[12px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">v{v.number}</span>
                        <div className="flex items-center gap-2">
                          <a href={personaForge.downloadUrl(project.id, v.number)} className="text-violet-700 hover:underline">Download</a>
                          {v.number !== project.current_version && (
                            <button onClick={() => restore(v.number)} className="text-slate-500 hover:text-slate-800 flex items-center gap-1">
                              <RotateCcw size={12} /> Restore
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-500 mt-1 leading-relaxed">{v.summary || "No summary"}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Job panel */}
            <div className="overflow-y-auto p-6">
              {jobError && <Banner tone="error" onDismiss={() => setJobError(null)}>{jobError}</Banner>}

              {!job && !jobError && (
                <EmptyState
                  icon={<Wand2 size={26} />}
                  title="No pending edit"
                  body="Write a prompt on the left. The AI plans the edit, applies it, validates the site, and shows you a diff before anything is saved."
                />
              )}

              {job && (
                <div className="space-y-6">
                  <StageTracker job={job} />

                  {inReview && (
                    <>
                      <ValidationSummary result={job.validation_result} repaired={job.repaired} />

                      {job.edit_plan?.summary && (
                        <Section title="Plan">
                          <p className="text-[13px] text-slate-600 leading-relaxed">{job.edit_plan.summary}</p>
                        </Section>
                      )}

                      <Section title={`Changed files (${job.changed_files?.length || 0})`}>
                        {job.changed_files?.length ? (
                          <ul className="flex flex-wrap gap-2">
                            {job.changed_files.map((f) => (
                              <li key={f} className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded-md">{f}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[13px] text-slate-500">The AI did not change any file.</p>
                        )}
                      </Section>

                      <Section
                        title="Preview"
                        action={
                          <div className="flex gap-1">
                            {VIEWPORTS.map((v) => (
                              <button
                                key={v.width}
                                onClick={() => setViewport(v.width)}
                                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition ${
                                  viewport === v.width ? "bg-[#2B0A5A] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                {v.label}
                              </button>
                            ))}
                          </div>
                        }
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <PreviewFrame
                            title="Original"
                            src={personaForge.versionPreviewUrl(project.id, project.current_version, project.entry_file)}
                            width={viewport}
                          />
                          <PreviewFrame
                            title="Modified"
                            src={personaForge.jobPreviewUrl(job.id, project.entry_file)}
                            width={viewport}
                          />
                        </div>
                      </Section>

                      <Section title="Diff">
                        {job.diffs?.length ? (
                          job.diffs.map((d) => (
                            <div key={d.file} className="mb-4">
                              <h4 className="text-[12px] font-semibold text-slate-700 mb-1">
                                {d.file} <span className="text-green-600">+{d.additions}</span>{" "}
                                <span className="text-red-600">-{d.deletions}</span>
                              </h4>
                              <pre className="bg-slate-900 text-slate-100 text-[11px] leading-relaxed rounded-xl p-3 overflow-x-auto max-h-72">
                                {d.unified_diff}
                              </pre>
                            </div>
                          ))
                        ) : (
                          <p className="text-[13px] text-slate-500">No textual differences.</p>
                        )}
                      </Section>

                      <div className="flex gap-3 sticky bottom-0 bg-white pt-4 border-t border-slate-100">
                        <button onClick={approve} className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition flex items-center gap-2">
                          <Check size={16} /> Approve &amp; save as v{project.current_version + 1}
                        </button>
                        <button onClick={reject} className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition">
                          Discard
                        </button>
                        <button onClick={retry} className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition flex items-center gap-2">
                          <RotateCcw size={16} /> Retry
                        </button>
                      </div>
                    </>
                  )}

                  {job.state === "failed" && (
                    <button onClick={retry} className="bg-[#2B0A5A] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#1d0342] transition flex items-center gap-2">
                      <RotateCcw size={16} /> Retry
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- pieces ---------------- */

function Banner({ tone, children, onDismiss }) {
  const tones = {
    error: "bg-red-50 border-red-100 text-red-700",
    warn: "bg-amber-50 border-amber-100 text-amber-800",
  };
  return (
    <div className={`mx-6 mt-4 mb-2 px-4 py-3 rounded-xl border text-[13px] flex items-start gap-2 ${tones[tone]}`}>
      <AlertCircle size={16} className="shrink-0 mt-0.5" />
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ icon, title, body }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-10">
      <div className="w-14 h-14 bg-violet-50 rounded-full flex items-center justify-center text-[#2B0A5A] mb-4">{icon}</div>
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <p className="text-[13px] text-slate-500 mt-2 max-w-sm leading-relaxed">{body}</p>
    </div>
  );
}

function StageTracker({ job }) {
  const running = JOB_PENDING_STATES.includes(job.state);
  return (
    <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
      {running ? (
        <Loader2 size={16} className="animate-spin text-[#2B0A5A]" />
      ) : job.state === "failed" ? (
        <AlertCircle size={16} className="text-red-600" />
      ) : (
        <Check size={16} className="text-green-600" />
      )}
      <span className="text-[13px] font-medium text-slate-700">
        {STAGE_LABELS[job.stage] || job.stage}
      </span>
      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold ml-auto">{job.state}</span>
    </div>
  );
}

function ValidationSummary({ result, repaired }) {
  if (!result) return null;
  const warnings = result.warnings || [];
  return (
    <div className="space-y-2">
      <div
        className={`px-4 py-3 rounded-xl border text-[13px] ${
          result.passed ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800"
        }`}
      >
        {result.passed
          ? `Validation passed${repaired ? " after an automatic repair pass." : "."}`
          : `${result.errors.length} unresolved issue(s): ${result.errors.join("; ")}`}
      </div>
      {warnings.length > 0 && <Banner tone="warn">{warnings.join(" · ")}</Banner>}
    </div>
  );
}

function PreviewFrame({ title, src, width }) {
  return (
    <div>
      <h4 className="text-[12px] font-semibold text-slate-600 mb-1">{title}</h4>
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <iframe
          title={title}
          src={src}
          sandbox="allow-same-origin"
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-[420px] block mx-auto"
          style={{ maxWidth: width }}
        />
      </div>
    </div>
  );
}

function Toggle({ label, name, settings, setSettings }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={settings[name]}
        onChange={(e) => setSettings((s) => ({ ...s, [name]: e.target.checked }))}
        className="accent-violet-600"
      />
      {label}
    </label>
  );
}

function ProjectPicker({ projects, busy, onOpen, onDelete, onUpload }) {
  const folderRef = useRef(null);
  const zipRef = useRef(null);

  // webkitdirectory has no JSX prop; set it on the DOM node.
  useEffect(() => {
    if (folderRef.current) {
      folderRef.current.webkitdirectory = true;
      folderRef.current.setAttribute("webkitdirectory", "");
      folderRef.current.setAttribute("directory", "");
    }
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-slate-800">Your websites</h3>
          <p className="text-[13px] text-slate-500">Upload a static site (HTML/CSS/JS) or a built React output, then edit it with a prompt.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => folderRef.current?.click()}
            disabled={busy}
            className="bg-[#2B0A5A] text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#1d0342] disabled:opacity-50 transition flex items-center gap-2"
          >
            <FolderUp size={16} /> Upload folder
          </button>
          <button
            onClick={() => zipRef.current?.click()}
            disabled={busy}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 disabled:opacity-50 transition"
          >
            Upload ZIP
          </button>
          <input ref={folderRef} type="file" multiple hidden onChange={(e) => { onUpload(e.target.files); e.target.value = ""; }} />
          <input ref={zipRef} type="file" accept=".zip" hidden onChange={(e) => { onUpload(e.target.files); e.target.value = ""; }} />
        </div>
      </div>

      {busy && (
        <div className="flex items-center gap-2 text-[13px] text-slate-500 mb-4">
          <Loader2 size={14} className="animate-spin" /> Working...
        </div>
      )}

      {!busy && projects.length === 0 ? (
        <EmptyState
          icon={<FolderUp size={26} />}
          title="No websites yet"
          body="Upload the folder of a website to let the AI personalise its copy, styling and components — with a diff and preview before anything is saved."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {projects.map((p) => (
            <li key={p.id} className="border border-slate-200 rounded-xl p-4 hover:border-violet-300 transition flex flex-col gap-3">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm truncate">{p.name}</h4>
                <p className="text-[12px] text-slate-500 truncate">{p.entry_file} · v{p.current_version}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {p.page_count} pages · {p.html_count} HTML · {p.css_count} CSS · {p.js_count} JS
                </p>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={() => onOpen(p.id)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-semibold py-2 rounded-lg transition"
                >
                  Open
                </button>
                <button
                  onClick={() => onDelete(p.id)}
                  aria-label={`Delete ${p.name}`}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
