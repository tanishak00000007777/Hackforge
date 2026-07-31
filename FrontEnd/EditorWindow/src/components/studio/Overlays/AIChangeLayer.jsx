import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

/**
 * Rings whatever the last AI turn touched, on the canvas itself.
 *
 * The assistant edits the page directly, so without this the reply says
 * "Done — 2 changes applied" and the user has to hunt down the page looking for
 * what moved. The first changed section is also scrolled into view.
 */
export default function AIChangeLayer({ zoom }) {
  const aiChangedIds = useEditorStore((state) => state.aiChangedIds);
  const [rects, setRects] = useState([]);

  // Bring the first edit into view once per turn, not on every reflow.
  useEffect(() => {
    if (!aiChangedIds.length) return;
    const node = document.querySelector(`[data-node-id="${aiChangedIds[0]}"]`);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [aiChangedIds]);

  useEffect(() => {
    if (!aiChangedIds.length) {
      setRects([]);
      return undefined;
    }

    const update = () => {
      const root = document.getElementById("canvas-root");
      if (!root) return;
      const rootRect = root.getBoundingClientRect();
      const scale = zoom / 100;

      setRects(
        aiChangedIds
          .map((id) => {
            const node = document.querySelector(`[data-node-id="${id}"]`);
            if (!node) return null;
            const rect = node.getBoundingClientRect();
            return {
              id,
              top: (rect.top - rootRect.top) / scale,
              left: (rect.left - rootRect.left) / scale,
              width: rect.width / scale,
              height: rect.height / scale,
            };
          })
          .filter(Boolean),
      );
    };

    update();
    const interval = setInterval(update, 1000 / 30);
    window.addEventListener("resize", update);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", update);
    };
  }, [aiChangedIds, zoom]);

  return rects.map((rect, index) => (
    <div
      key={rect.id}
      className="absolute z-40 rounded-lg border-2 border-violet-500 bg-violet-500/5 pointer-events-none"
      style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
    >
      {/* One badge for the group, on the first change, so a five-node edit is
          not five overlapping labels. */}
      {index === 0 && (
        <span className="absolute -top-6 left-0 flex items-center gap-1 rounded-md bg-violet-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
          <Sparkles size={11} strokeWidth={2.2} />
          Updated by AI
        </span>
      )}
    </div>
  ));
}
