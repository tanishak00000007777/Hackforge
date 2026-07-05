import { useEditorStore } from "@/store/editorStore";
import { RotateCcw, RotateCw, Clock } from "lucide-react";

export default function HistoryPanel() {
  const history = useEditorStore((state) => state.history);
  const future = useEditorStore((state) => state.future);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-4 border-b">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Clock size={20} className="text-violet-600" />
          History
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {future.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase">Future (Redo)</h3>
            {[...future].reverse().map((state, i) => (
              <button
                key={i}
                onClick={redo}
                className="w-full text-left px-3 py-2 text-sm text-slate-500 rounded-lg hover:bg-slate-100 flex items-center gap-2"
              >
                <RotateCw size={14} />
                Action available to redo
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase">Current Session</h3>
          <div className="px-3 py-2 text-sm text-violet-700 font-medium bg-violet-50 rounded-lg border border-violet-100">
            Current State
          </div>
          {[...history].reverse().map((state, i) => (
            <button
              key={i}
              onClick={undo}
              className="w-full text-left px-3 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-100 flex items-center gap-2"
            >
              <RotateCcw size={14} />
              Restore previous state
            </button>
          ))}
          
          {history.length === 0 && (
            <div className="text-sm text-slate-500 italic px-3 py-2">
              No history yet. Start editing to save changes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
