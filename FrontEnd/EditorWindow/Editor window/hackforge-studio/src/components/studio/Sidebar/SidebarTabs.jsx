import { useEditorStore } from "@/store/editorStore";

export default function SidebarTabs() {
  const sidebarTab = useEditorStore((state) => state.sidebarTab);
  const setSidebarTab = useEditorStore((state) => state.setSidebarTab);

  const tabs = ["Elements", "Sections", "Assets", "Layers", "History"];

  return (
    <div className="px-4 pb-4">
      <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto gap-1" style={{ scrollbarWidth: 'none' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setSidebarTab(tab)}
            className={`
              flex-1 shrink-0 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap
              ${sidebarTab === tab ? "bg-white shadow-sm text-violet-600" : "text-slate-500 hover:text-slate-800"}
            `}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
