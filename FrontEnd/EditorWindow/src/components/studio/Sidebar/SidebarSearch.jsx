import { Search } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

export default function SidebarSearch() {
  const sidebarSearch = useEditorStore((state) => state.sidebarSearch);
  const setSidebarSearch = useEditorStore((state) => state.setSidebarSearch);

  return (
    <div className="relative px-5 pb-4">
      <Search size={14} className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={sidebarSearch}
        onChange={(e) => setSidebarSearch(e.target.value)}
        placeholder="Search blocks…"
        aria-label="Search blocks"
        className="w-full rounded-xl border border-[#E7E8F4] bg-white py-2 pl-8 pr-3 text-[12.5px] outline-none transition focus:border-violet-400"
      />
    </div>
  );
}
