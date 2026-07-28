import { Minus, Plus, Scan } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

export default function ZoomToolbar() {
  const zoom = useEditorStore((state) => state.zoom);
  const zoomIn = useEditorStore((state) => state.zoomIn);
  const zoomOut = useEditorStore((state) => state.zoomOut);
  const setZoom = useEditorStore((state) => state.setZoom);
  const setPan = useEditorStore((state) => state.setPan);

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
      <button onClick={zoomOut} className="p-1 hover:bg-slate-100 rounded-2xl text-slate-500">
        <Minus size={18} />
      </button>

      <span className="font-label-sm text-label-sm text-slate-600">
        {zoom}%
      </span>

      <button onClick={zoomIn} className="p-1 hover:bg-slate-100 rounded-2xl text-slate-500">
        <Plus size={18} />
      </button>

      <div className="w-px h-4 bg-slate-200 mx-2" />

      <button 
        onClick={() => {
          setZoom(100);
          setPan({ x: 0, y: 0 });
        }} 
        className="p-1 hover:bg-slate-100 rounded-2xl text-slate-500 transition-colors"
        title="Reset Zoom & Position"
      >
        <Scan size={18} />
      </button>
    </div>
  );
}