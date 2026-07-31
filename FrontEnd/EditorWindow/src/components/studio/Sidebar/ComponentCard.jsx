import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/store/editorStore";
import { createFromCatalogue } from "@/builder/factories/coreFactory";
import { Star } from "lucide-react";

export default function ComponentCard({
  type,
  icon: Icon,
  title,
  description,
  isFavorite,
}) {
  const setDraggedSidebarComponent = useEditorStore((state) => state.setDraggedSidebarComponent);
  const toggleFavorite = useEditorStore((state) => state.toggleFavorite);
  const addRecent = useEditorStore((state) => state.addRecent);
  const addComponent = useEditorStore((state) => state.addComponent);
  const select = useEditorStore((state) => state.select);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    setDraggedSidebarComponent(type);
    addRecent(type);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuOpen(true);
  };

  // Dragging is the fast path, but a click that never reaches the canvas would
  // otherwise do nothing at all -- and an organizer who is not comfortable
  // dragging has no other way in. A click appends to the end of the page.
  const handleClick = () => {
    const node = createFromCatalogue(type);
    if (!node) return;
    addComponent(node);
    select(node.id);
    addRecent(type);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onDragStart={(e) => e.preventDefault()}
        title={`${description} — drag onto the page, or click to add it`}
        className="
          flex w-full flex-col items-center justify-center gap-2
          rounded-xl border border-[#E7E8F4] bg-white p-3.5
          cursor-grab transition-all duration-150
          hover:border-violet-400 hover:bg-violet-50/40 hover:shadow-sm
          active:cursor-grabbing active:scale-[0.98]
          select-none touch-none
        "
      >
        <span className="text-slate-500">
          {Icon ? <Icon size={20} strokeWidth={1.7} /> : null}
        </span>

        <span className="text-[11.5px] font-semibold text-slate-700 text-center">
          {title}
        </span>

        {isFavorite && (
          <Star size={11} className="absolute top-2 right-2 text-amber-400 fill-amber-400" />
        )}
      </button>

      {menuOpen && (
        <div 
          ref={menuRef}
          className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1"
        >
          <button 
            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700"
            onClick={() => {
              toggleFavorite(type);
              setMenuOpen(false);
            }}
          >
            <Star size={14} className={isFavorite ? "fill-yellow-400 text-yellow-400" : ""} />
            {isFavorite ? "Remove Favorite" : "Add to Favorites"}
          </button>
        </div>
      )}
    </div>
  );
}