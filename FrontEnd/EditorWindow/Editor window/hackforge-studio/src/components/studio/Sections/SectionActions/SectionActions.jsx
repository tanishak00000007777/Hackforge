import {
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import { useEditorStore } from "@/store/editorStore";

export default function SectionActions({ index, id }) {
  const duplicateComponent = useEditorStore(
    (state) => state.duplicateComponent
  );

  const deleteComponent = useEditorStore(
    (state) => state.deleteComponent
  );

  const moveComponent = useEditorStore(
    (state) => state.moveComponent
  );

  return (
    <div className="flex items-center gap-1 rounded-xl bg-white border shadow-lg p-1">

      <button
        onClick={() => moveComponent(index, index - 1)}
        disabled={index === 0}
        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40"
      >
        <ChevronUp size={16} />
      </button>

      <button
        onClick={() => moveComponent(index, index + 1)}
        className="p-2 rounded-lg hover:bg-slate-100"
      >
        <ChevronDown size={16} />
      </button>

      <button
        onClick={() => duplicateComponent(id)}
        className="p-2 rounded-lg hover:bg-slate-100"
      >
        <Copy size={16} />
      </button>

      <button
        onClick={() => deleteComponent(id)}
        className="p-2 rounded-lg hover:bg-red-100 text-red-600"
      >
        <Trash2 size={16} />
      </button>

    </div>
  );
}