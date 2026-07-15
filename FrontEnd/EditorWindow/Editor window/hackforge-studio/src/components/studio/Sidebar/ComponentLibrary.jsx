import { useMemo } from "react";
import ComponentCard from "./ComponentCard";
import { useEditorStore } from "@/store/editorStore";
import { catalogueMetadata } from "@/builder/registry";

export default function ComponentLibrary() {
  const sidebarTab = useEditorStore((state) => state.sidebarTab);
  const sidebarSearch = useEditorStore((state) => state.sidebarSearch);
  const sidebarFavorites = useEditorStore((state) => state.sidebarFavorites);
  const sidebarRecent = useEditorStore((state) => state.sidebarRecent);

  const groupedComponents = useMemo(() => {
    let filtered = Object.entries(catalogueMetadata).map(([key, meta]) => ({
      type: key,
      ...meta,
    }));

    if (sidebarSearch) {
      const q = sidebarSearch.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.type.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    } else {
      if (sidebarTab === "Sections") {
        filtered = filtered.filter((c) => c.category === "Sections");
      } else if (sidebarTab === "Elements") {
        filtered = filtered.filter((c) => c.category !== "Sections");
      } else if (sidebarTab === "Favorites") {
        filtered = filtered.filter((c) => sidebarFavorites.includes(c.type));
      } else if (sidebarTab === "Recent") {
        filtered = filtered.filter((c) => sidebarRecent.includes(c.type));
        // Sort by recent order
        filtered.sort((a, b) => sidebarRecent.indexOf(a.type) - sidebarRecent.indexOf(b.type));
      }
    }

    // Group by category
    const groups = {};
    filtered.forEach((c) => {
      const cat = c.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
    });

    return groups;
  }, [sidebarTab, sidebarSearch, sidebarFavorites, sidebarRecent]);

  if (Object.keys(groupedComponents).length === 0) {
    return (
      <div className="px-4 text-sm text-slate-500 text-center py-10">
        No components found.
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 space-y-6">
      {Object.entries(groupedComponents).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            {category}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <ComponentCard
                key={item.type}
                type={item.type}
                title={item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                icon={item.icon}
                description={item.description}
                isFavorite={sidebarFavorites.includes(item.type)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
