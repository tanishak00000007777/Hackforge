import { useEditorStore } from "@/store/editorStore";

// Sections come first: an organizer builds a page out of blocks long before
// they place a single button. The ids behind the labels are unchanged.
const TABS = [
  { id: "Sections", label: "Sections" },
  { id: "Elements", label: "Basics" },
  { id: "Assets", label: "Media" },
  { id: "Layers", label: "Layers" },
  { id: "History", label: "Versions" },
];

export default function SidebarTabs() {
  const sidebarTab = useEditorStore((state) => state.sidebarTab);
  const setSidebarTab = useEditorStore((state) => state.setSidebarTab);

  return (
    <div className="px-5 pb-4">
      <div className="flex gap-0.5 rounded-xl bg-[#F1EFF8] p-1" style={{ scrollbarWidth: "none" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSidebarTab(tab.id)}
            className={`
              flex-1 rounded-lg px-1.5 py-1.5 text-[11.5px] font-semibold transition-all
              ${sidebarTab === tab.id ? "bg-white text-[#2B0A5A] shadow-sm" : "text-slate-500 hover:text-slate-800"}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
