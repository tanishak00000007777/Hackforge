import {
  Minus,
  Plus,
  Scan,
} from "lucide-react";

export default function ZoomToolbar() {
  return (
    <div
      className="
        fixed
        bottom-8
        left-1/2
        -translate-x-1/2
        bg-white/90
        backdrop-blur-md
        px-4
        py-2
        rounded-2xl
        shadow-lg
        border
        border-outline-variant/20
        flex
        items-center
        gap-4
        z-40
      "
    >
      <button className="p-1 hover:bg-surface-container-high rounded-2xl">
        <Minus size={18} />
      </button>

      <span className="font-label-sm text-label-sm text-on-surface-variant">
        85%
      </span>

      <button className="p-1 hover:bg-surface-container-high rounded-2xl">
        <Plus size={18} />
      </button>

      <div className="w-px h-4 bg-outline-variant mx-2" />

      <button className="p-1 hover:bg-surface-container-high rounded-2xl">
        <Scan size={18} />
      </button>
    </div>
  );
}