import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { Files, Plus, Trash2, Copy, Check } from "lucide-react";

export default function PageSwitcher() {
  const pages = useEditorStore((state) => state.pages);
  const currentPageId = useEditorStore((state) => state.currentPageId);
  const switchPage = useEditorStore((state) => state.switchPage);
  const addPage = useEditorStore((state) => state.addPage);
  const deletePage = useEditorStore((state) => state.deletePage);
  const duplicatePage = useEditorStore((state) => state.duplicatePage);
  const renamePage = useEditorStore((state) => state.renamePage);

  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);

  const current = pages.find((page) => page.id === currentPageId) || pages[0];

  const createPage = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addPage(newName.trim());
    setNewName("");
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* The page name is the document title: it reads as content, not chrome. */}
      <button
        onClick={() => setIsOpen((open) => !open)}
        title="Switch page"
        className={`flex h-9 max-w-[220px] items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold transition-colors
          ${isOpen ? "bg-[#F1EEF9] text-[#2B0A5A]" : "text-[#130225] hover:bg-[#F4F2FA]"}`}
      >
        <Files size={13} className="shrink-0 text-[#8A8697]" />
        <span className="truncate">{current?.name || "Page"}</span>
        {pages.length > 1 && (
          <span className="shrink-0 rounded-full bg-[#EFEDF6] px-1.5 text-[10px] font-bold text-[#8A8697]">
            {pages.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
          {/* Left-aligned: this button sits at the far left of the toolbar, so
              a right-aligned panel would hang off the edge of the screen. */}
          <div className="absolute left-0 top-11 z-50 w-[280px] max-w-[calc(100vw-1.5rem)] rounded-xl border border-[#E7E8F4] bg-white p-1.5 shadow-[0_8px_28px_rgba(19,2,37,0.10)]">
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {pages.map((page) => (
                <li key={page.id} className="group flex items-center rounded-lg pr-1 hover:bg-[#F6F5FB]">
                  {editingId === page.id ? (
                    <input
                      autoFocus
                      defaultValue={page.name}
                      onBlur={(e) => { renamePage(page.id, { name: e.target.value, path: e.target.value }); setEditingId(null); }}
                      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                      className="mx-1 my-1 flex-1 rounded-md border border-violet-300 px-2 py-1 text-[13px] outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => { switchPage(page.id); setIsOpen(false); }}
                      onDoubleClick={() => setEditingId(page.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-[13px]"
                      title="Double-click to rename"
                    >
                      {page.id === currentPageId
                        ? <Check size={13} className="shrink-0 text-[#2B0A5A]" />
                        : <span className="w-[13px] shrink-0" />}
                      <span className="truncate font-medium text-[#383547]">{page.name}</span>
                      {/* Shrinks before the name does, so long names stay readable. */}
                      <span className="ml-auto min-w-0 shrink truncate font-mono text-[10px] text-[#A5A1B2]">{page.path}</span>
                    </button>
                  )}

                  <button
                    onClick={() => duplicatePage(page.id)}
                    aria-label={`Duplicate ${page.name}`}
                    className="shrink-0 rounded-md p-1.5 text-[#A5A1B2] opacity-0 transition hover:bg-[#EFEDF6] hover:text-[#383547] focus:opacity-100 group-hover:opacity-100"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={() => deletePage(page.id)}
                    disabled={pages.length <= 1}
                    aria-label={`Delete ${page.name}`}
                    title={pages.length <= 1 ? "A site needs at least one page" : `Delete ${page.name}`}
                    className="shrink-0 rounded-md p-1.5 text-[#A5A1B2] opacity-0 transition hover:bg-red-50 hover:text-red-600 focus:opacity-100 disabled:cursor-not-allowed disabled:opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>

            <form onSubmit={createPage} className="mt-1.5 flex gap-1.5 border-t border-[#EFEDF6] pt-1.5">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New page name"
                className="min-w-0 flex-1 rounded-md border border-[#E7E8F4] px-2 py-1.5 text-[13px] outline-none placeholder:text-[#A5A1B2] focus:border-violet-400"
              />
              <button
                type="submit"
                disabled={!newName.trim()}
                className="flex shrink-0 items-center gap-1 rounded-md bg-[#130225] px-2.5 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-[#2B0A5A] disabled:opacity-30"
              >
                <Plus size={13} /> Add
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
