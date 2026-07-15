import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/store/editorStore";
import { Star, Plus } from "lucide-react";

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

  return (
    <div className="relative">
      <div
        onPointerDown={handlePointerDown}
        onContextMenu={handleContextMenu}
        onDragStart={(e) => e.preventDefault()}
        title={description}
        className="
          flex flex-col items-center justify-center gap-1.5
          p-3 rounded-lg border border-slate-200 bg-white
          cursor-grab transition-all duration-200
          hover:shadow-md hover:border-violet-400
          active:cursor-grabbing active:scale-[0.98]
          select-none touch-none
        "
      >
        <span className="text-slate-600">
          {Icon ? <Icon size={20} /> : null}
        </span>

        <span className="text-xs font-semibold text-slate-700 text-center">
          {title}
        </span>
        
        {isFavorite && (
          <Star size={12} className="absolute top-2 right-2 text-yellow-400 fill-yellow-400" />
        )}
      </div>

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
