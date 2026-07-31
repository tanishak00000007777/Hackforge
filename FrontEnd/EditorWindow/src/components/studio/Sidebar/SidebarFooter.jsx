import { Sparkles } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

/**
 * This card used to advertise "Upgrade Pro", a button that did nothing. The
 * space now opens the thing it was describing.
 */
export default function SidebarFooter() {
  const setCopilotOpen = useEditorStore((state) => state.setCopilotOpen);

  // pb-14 keeps the card clear of the host app's fixed "Back to dashboard" button.
  return (
    <div className="mt-auto px-5 pb-14 pt-5">
      <button
        type="button"
        onClick={() => setCopilotOpen(true)}
        className="flex w-full items-start gap-2.5 rounded-2xl border border-violet-100 bg-violet-50/60 p-3.5 text-left transition hover:border-violet-300 hover:bg-violet-50"
      >
        <Sparkles size={15} strokeWidth={1.9} className="mt-0.5 shrink-0 text-[#2B0A5A]" />
        <span>
          <span className="block text-[12.5px] font-semibold text-[#2B0A5A]">Ask AI to build it</span>
          <span className="mt-0.5 block text-[11.5px] leading-relaxed text-slate-500">
            Describe the section you want and it appears on the page.
          </span>
        </span>
      </button>
    </div>
  );
}
