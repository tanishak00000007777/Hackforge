import { useEditorStore } from "@/store/editorStore";

export default function SidebarSearch() {
  const sidebarSearch = useEditorStore((state) => state.sidebarSearch);
  const setSidebarSearch = useEditorStore((state) => state.setSidebarSearch);

  return (
    <div className="px-4 pb-3">
      <input
        type="text"
        value={sidebarSearch}
        onChange={(e) => setSidebarSearch(e.target.value)}
        placeholder="Search components..."
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-600"
      />
    </div>
  );
}
