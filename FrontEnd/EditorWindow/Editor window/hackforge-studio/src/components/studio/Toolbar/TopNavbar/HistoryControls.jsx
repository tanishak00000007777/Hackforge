import ToolbarGroup from "@/components/shared/ToolbarGroup";
import IconButton from "@/components/primitives/IconButton";
import { Undo2, Redo2 } from "@/assets/icons";

export default function HistoryControls({
  onUndo,
  onRedo,
  canUndo = true,
  canRedo = true,
}) {
  return (
    <ToolbarGroup>
      <IconButton
        title="Undo"
        icon={<Undo2 size={16} />}
        disabled={!canUndo}
        onClick={onUndo}
      />

      <IconButton
        title="Redo"
        icon={<Redo2 size={16} />}
        disabled={!canRedo}
        onClick={onRedo}
      />
    </ToolbarGroup>
  );
}