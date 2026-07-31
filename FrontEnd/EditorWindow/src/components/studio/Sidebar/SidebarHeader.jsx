import { useEditorStore } from "@/store/editorStore";

/**
 * The title used to read "Elements" whichever panel was open. Each tab now
 * says what it is and what it is for, in words an organizer already knows.
 */
const COPY = {
  Sections: ["Elements", "Whole blocks — a hero, a schedule, sponsors."],
  Elements: ["Elements", "Text, buttons, images and other small pieces."],
  Assets: ["Elements", "Pictures and video you have uploaded."],
  Layers: ["Layers", "Everything on this page, front to back."],
  History: ["Versions", "Undo a recent edit, or go back to a saved version."],
};

export default function SidebarHeader() {
  const sidebarTab = useEditorStore((state) => state.sidebarTab);
  const [title, hint] = COPY[sidebarTab] || COPY.Elements;

  return (
    <div className="px-5 pb-4">
      <h2 className="text-[17px] font-bold text-[#17154D]">{title}</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{hint}</p>
    </div>
  );
}
