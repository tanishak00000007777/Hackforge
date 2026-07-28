import { useEffect, useRef } from "react";
import { AlertCircle, Check, Cloud, Loader2 } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { useIntegrationStore } from "@/store/integrationStore";

/**
 * Debounced backend autosave. Browser persistence remains a recovery cache,
 * while this indicator reports the canonical HackForge save state.
 */
export default function SaveIndicator() {
  const components = useEditorStore((state) => state.components);
  const pages = useEditorStore((state) => state.pages);
  const globalTheme = useEditorStore((state) => state.globalTheme);
  const assets = useEditorStore((state) => state.assets);
  const device = useEditorStore((state) => state.device);
  const loadStatus = useIntegrationStore((state) => state.loadStatus);
  const saveStatus = useIntegrationStore((state) => state.saveStatus);
  const saveWebsite = useIntegrationStore((state) => state.saveWebsite);
  const previousProject = useRef(null);

  useEffect(() => {
    if (loadStatus !== "ready") return undefined;
    const project = JSON.stringify({ components, pages, globalTheme, assets, device });
    if (previousProject.current === null) {
      previousProject.current = project;
      return undefined;
    }
    if (previousProject.current === project) return undefined;
    previousProject.current = project;
    const timer = setTimeout(() => saveWebsite().catch(() => {}), 1200);
    return () => clearTimeout(timer);
  }, [assets, components, device, globalTheme, loadStatus, pages, saveWebsite]);

  const status = {
    saving: { icon: Loader2, label: "Saving", spin: true },
    publishing: { icon: Loader2, label: "Publishing", spin: true },
    error: { icon: AlertCircle, label: "Save failed", error: true },
    published: { icon: Cloud, label: "Published" },
  }[saveStatus] || { icon: Check, label: "Saved" };
  const StatusIcon = status.icon;

  return (
    <span
      className={`hidden items-center gap-1.5 text-[12px] lg:flex ${status.error ? "text-red-600" : "text-[#A5A1B2]"}`}
      title="Your work is saved to HackForge"
    >
      <StatusIcon size={12} className={status.spin ? "animate-spin" : ""} />
      {status.label}
    </span>
  );
}
