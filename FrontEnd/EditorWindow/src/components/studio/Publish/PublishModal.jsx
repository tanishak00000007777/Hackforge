import { useEffect, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { useIntegrationStore } from "@/store/integrationStore";
import { exportTemplate } from "@/builder/utils/TemplateManager";
import { exportReactProject, exportStaticSite } from "@/builder/utils/ProjectExporter";

export default function PublishModal({ isOpen, onClose }) {
  const components = useEditorStore((state) => state.components);
  const globalTheme = useEditorStore((state) => state.globalTheme);
  const saveWebsite = useIntegrationStore((state) => state.saveWebsite);
  const saveStatus = useIntegrationStore((state) => state.saveStatus);
  const error = useIntegrationStore((state) => state.error);
  const hackathon = useIntegrationStore((state) => state.hackathon);
  const [isFinished, setIsFinished] = useState(saveStatus === "published");

  useEffect(() => {
    if (isOpen) setIsFinished(saveStatus === "published");
  }, [isOpen, saveStatus]);

  if (!isOpen) return null;

  const handlePublish = async () => {
    try {
      await saveWebsite({ publish: true });
      setIsFinished(true);
    } catch {
      setIsFinished(false);
    }
  };

  const handleExportJSON = () => {
    exportTemplate({
      type: "website",
      name: hackathon?.title || "Published Site",
      data: { components, globalTheme },
    }, "published-site.json");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm">
      <div className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-8 py-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Publish website</h2>
            <p className="mt-1 text-sm text-slate-500">{hackathon?.title || "HackForge event"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close publish dialog"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors hover:text-slate-600"
          >
            &times;
          </button>
        </div>

        <div className="p-8">
          {!isFinished ? (
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Ready to publish?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                The latest Studio configuration will be saved to HackForge and this hackathon will be marked as published.
              </p>
              {saveStatus === "error" && (
                <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
              )}
              <button
                type="button"
                onClick={handlePublish}
                disabled={saveStatus === "publishing" || saveStatus === "saving"}
                className="mt-6 w-full rounded-lg bg-[#130225] px-4 py-3 text-sm font-semibold text-white hover:bg-[#2B0A5A] disabled:cursor-wait disabled:opacity-60"
              >
                {saveStatus === "publishing" || saveStatus === "saving" ? "Publishing..." : "Publish website"}
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 p-4 text-green-800">
                <span className="text-xl" aria-hidden="true">&#10003;</span>
                <div>
                  <h4 className="text-sm font-semibold">Website published</h4>
                  <p className="text-xs opacity-80">The saved configuration is attached to this HackForge event.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => exportStaticSite(useEditorStore.getState().getPages(), globalTheme)}
                  className="rounded-xl border border-slate-200 bg-white py-4 text-sm font-semibold text-slate-700 transition-all hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Static site
                </button>
                <button
                  type="button"
                  onClick={() => exportReactProject(components, globalTheme)}
                  className="rounded-xl border border-slate-200 bg-white py-4 text-sm font-semibold text-slate-700 transition-all hover:border-[#2B0A5A] hover:bg-slate-50 hover:text-violet-700"
                >
                  React ZIP
                </button>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="rounded-xl border border-slate-200 bg-white py-4 text-sm font-semibold text-slate-700 transition-all hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
