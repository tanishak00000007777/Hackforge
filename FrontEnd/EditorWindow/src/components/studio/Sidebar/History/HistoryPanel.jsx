import { useEffect, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { useIntegrationStore } from "@/store/integrationStore";
import { diffTrees, describeDiff } from "@/builder/commands/diffTree";
import { BookmarkPlus, Loader2, RotateCcw, Undo2, Redo2 } from "lucide-react";

const RELATIVE = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const UNITS = [
  ["day", 86400000],
  ["hour", 3600000],
  ["minute", 60000],
];

/** "3 minutes ago". The API sends UTC; a bare timestamp would be read as local. */
function timeAgo(iso) {
  const stamp = /(Z|[+-]\d\d:?\d\d)$/.test(iso) ? iso : `${iso}Z`;
  const elapsed = Date.now() - new Date(stamp).getTime();
  for (const [unit, ms] of UNITS) {
    if (elapsed >= ms) return RELATIVE.format(-Math.floor(elapsed / ms), unit);
  }
  return "just now";
}

const SOURCE_BADGE = {
  publish: { label: "Live", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ai: { label: "AI", className: "bg-violet-50 text-violet-700 border-violet-200" },
  restore: { label: "Restored", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

/** The page the snapshot was left on, which is what its components belong to. */
function componentsOf(project) {
  const pages = project?.pages || [];
  const page = pages.find((entry) => entry.id === project?.currentPageId) || pages[0];
  return page?.components || project?.components || [];
}

export default function HistoryPanel() {
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const undoCount = useEditorStore((state) => state.history.length);
  const redoCount = useEditorStore((state) => state.future.length);

  const session = useIntegrationStore((state) => state.session);
  const versions = useIntegrationStore((state) => state.versions);
  const versionsStatus = useIntegrationStore((state) => state.versionsStatus);
  const versionsError = useIntegrationStore((state) => state.versionsError);
  const loadVersions = useIntegrationStore((state) => state.loadVersions);
  const saveCheckpoint = useIntegrationStore((state) => state.saveCheckpoint);
  const readVersion = useIntegrationStore((state) => state.readVersion);
  const restoreToVersion = useIntegrationStore((state) => state.restoreToVersion);

  const [openId, setOpenId] = useState(null);
  const [diff, setDiff] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVersions();
  }, [loadVersions, session]);

  const openVersion = async (version) => {
    if (openId === version.id) {
      setOpenId(null);
      return;
    }
    setOpenId(version.id);
    setDiff(null);
    setError(null);
    try {
      const detail = await readVersion(version.id);
      const changes = diffTrees(componentsOf(detail.project), useEditorStore.getState().components);
      setDiff({ id: version.id, summary: changes.summary, lines: describeDiff(changes, 8) });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCheckpoint = async () => {
    const label = window.prompt("Name this version", `Checkpoint ${new Date().toLocaleString()}`);
    if (!label?.trim()) return;
    setBusy("checkpoint");
    setError(null);
    try {
      await saveCheckpoint(label.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async (version) => {
    if (!window.confirm(`Put the page back to "${version.label}"? Your current work is saved first.`)) return;
    setBusy(version.id);
    setError(null);
    try {
      await restoreToVersion(version.id);
      setOpenId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 px-5 pb-10">
      {/* Right now — the undo stack, which lives only as long as this tab does */}
      <section>
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Right now</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={undoCount === 0}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E7E8F4] bg-white py-2 text-[12px] font-semibold text-slate-600 transition hover:border-violet-300 hover:text-[#2B0A5A] disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:border-[#E7E8F4]"
          >
            <Undo2 size={14} strokeWidth={1.9} /> Undo {undoCount > 0 && `(${undoCount})`}
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={redoCount === 0}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E7E8F4] bg-white py-2 text-[12px] font-semibold text-slate-600 transition hover:border-violet-300 hover:text-[#2B0A5A] disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:border-[#E7E8F4]"
          >
            <Redo2 size={14} strokeWidth={1.9} /> Redo {redoCount > 0 && `(${redoCount})`}
          </button>
        </div>
      </section>

      {/* Saved versions — the timeline that survives the tab closing */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Saved versions</h3>
          <button
            type="button"
            onClick={handleCheckpoint}
            disabled={!session || busy === "checkpoint"}
            className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11.5px] font-semibold text-[#2B0A5A] transition hover:bg-violet-50 disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            {busy === "checkpoint" ? <Loader2 size={13} className="animate-spin" /> : <BookmarkPlus size={13} />}
            Save one
          </button>
        </div>

        {error && (
          <p className="mb-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[11.5px] text-red-600">{error}</p>
        )}

        {!session ? (
          <p className="text-[12px] leading-relaxed text-slate-500">
            Open this editor from your event dashboard to keep saved versions.
          </p>
        ) : versionsStatus === "loading" && versions.length === 0 ? (
          <p className="flex items-center gap-2 text-[12px] text-slate-400">
            <Loader2 size={13} className="animate-spin" /> Loading…
          </p>
        ) : versionsStatus === "error" ? (
          <button
            type="button"
            onClick={loadVersions}
            className="text-[12px] font-medium text-red-600 underline underline-offset-2"
          >
            {versionsError || "Could not load versions"} — retry
          </button>
        ) : versions.length === 0 ? (
          <p className="text-[12px] leading-relaxed text-slate-500">
            No saved versions yet. Save one before a big change so you can always come back to it.
          </p>
        ) : (
          <ol className="relative space-y-1 border-l border-[#E7E8F4] pl-4">
            {versions.map((version) => {
              const badge = version.is_published ? SOURCE_BADGE.publish : SOURCE_BADGE[version.source];
              const isOpen = openId === version.id;

              return (
                <li key={version.id} className="relative">
                  <span
                    className={`absolute -left-[21px] top-3 h-2 w-2 rounded-full ring-2 ring-[#FCFBFE]
                      ${version.is_published ? "bg-emerald-500" : isOpen ? "bg-violet-500" : "bg-slate-300"}`}
                  />
                  <button
                    type="button"
                    onClick={() => openVersion(version)}
                    className={`w-full rounded-xl px-2.5 py-2 text-left transition
                      ${isOpen ? "bg-violet-50" : "hover:bg-slate-50"}`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-slate-700">
                        {version.label}
                      </span>
                      {badge && (
                        <span className={`shrink-0 rounded-md border px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide ${badge.className}`}>
                          {badge.label}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">
                      v{version.version} · {timeAgo(version.created_at)}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mb-2 ml-2.5 mr-2 rounded-xl border border-[#E7E8F4] bg-white p-2.5">
                      {!diff || diff.id !== version.id ? (
                        <p className="flex items-center gap-2 text-[11.5px] text-slate-400">
                          <Loader2 size={12} className="animate-spin" /> Comparing…
                        </p>
                      ) : (
                        <>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Changed since then — {diff.summary}
                          </p>
                          {diff.lines.length > 0 && (
                            <ul className="mt-1.5 space-y-1">
                              {diff.lines.map((line, i) => (
                                <li key={i} className="truncate font-mono text-[10.5px] text-slate-600" title={line}>
                                  {line}
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRestore(version)}
                        disabled={busy === version.id}
                        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#2B0A5A] py-1.5 text-[11.5px] font-semibold text-white transition hover:bg-[#1d0342] disabled:bg-slate-300"
                      >
                        {busy === version.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <RotateCcw size={12} strokeWidth={2} />
                        )}
                        Put the page back to this
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
