import { LayoutTemplate, Grid2x2 } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

const icons = {
  hero: LayoutTemplate,
  tracks: Grid2x2,
};

export default function LayerItem({ component }) {
  const selectedId = useEditorStore((state) => state.selectedId);
  const select = useEditorStore((state) => state.select);

  const Icon = icons[component.type] ?? LayoutTemplate;

  const isSelected = selectedId === component.id;

  return (
    <button
      onClick={() => select(component.id)}
      className={`
        w-full
        flex
        items-center
        gap-3
        px-3
        py-2
        rounded-lg
        transition-all
        text-left
        ${
          isSelected
            ? "bg-violet-100 text-violet-700"
            : "hover:bg-slate-100"
        }
      `}
    >
      <Icon size={18} />

      <span className="flex-1 capitalize">
        {component.type}
      </span>
    </button>
  );
}