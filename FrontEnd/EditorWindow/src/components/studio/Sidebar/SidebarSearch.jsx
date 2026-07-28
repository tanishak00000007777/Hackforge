import { useEditorStore } from "@/store/editorStore";

export default function SidebarSearch() {
  const sidebarSearch = useEditorStore((state) => state.sidebarSearch);
  const setSidebarSearch = useEditorStore((state) => state.setSidebarSearch);

  return (
    <div className="px-5 py-4">
      <input
        type="text"
        value={sidebarSearch}
        onChange={(e) => setSidebarSearch(e.target.value)}
        placeholder="Search components..."
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-600"
      />
    </div>
  );
}