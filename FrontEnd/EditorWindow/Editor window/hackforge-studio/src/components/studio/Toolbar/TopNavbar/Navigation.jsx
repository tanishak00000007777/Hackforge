import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";

const ITEMS = [
  {
    id: "templates",
    label: "Templates",
  },
  {
    id: "preview",
    label: "Preview",
  },
];

export default function Navigation() {
  const setTemplatesModalOpen = useEditorStore((state) => state.setTemplatesModalOpen);
  const isPreviewMode = useEditorStore((state) => state.isPreviewMode);
  const setPreviewMode = useEditorStore((state) => state.setPreviewMode);

  const getActive = () => {
    if (isPreviewMode) return "preview";
    return "";
  };

  const active = getActive();

  const handleNavClick = (id) => {
    if (id === "templates") {
      setTemplatesModalOpen(true);
    } else if (id === "preview") {
      setPreviewMode(!isPreviewMode);
    }
  };

  return (
    <nav className="hidden xl:flex items-center gap-4">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => handleNavClick(item.id)}
          className="group relative pb-2 text-[15px] font-medium transition-colors"
        >
          <span
            className={
              active === item.id
                ? "text-violet-600 font-semibold"
                : "text-[#5E5B6B] group-hover:text-[#130225]"
            }
          >
            {item.label}
          </span>

          <span
            className={
              active === item.id
                ? "absolute left-0 bottom-0 h-[2px] w-full rounded-full bg-[#2B0A5A]"
                : "absolute left-0 bottom-0 h-[2px] w-0 bg-[#130225] transition-all group-hover:w-full"
            }
          />
        </button>
      ))}
    </nav>
  );
}
