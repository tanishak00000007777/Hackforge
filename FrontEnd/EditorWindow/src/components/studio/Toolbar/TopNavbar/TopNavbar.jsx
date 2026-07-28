import { Undo2, Redo2, Eye, Plus } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import Logo from "./Logo";
import DeviceSwitcher from "./DeviceSwitcher";
import PublishControls from "./PublishControls";
import UserProfile from "./UserProfile";
import PageSwitcher from "./PageSwitcher";
import AIMenu from "./AIMenu";
import ProjectMenu from "./ProjectMenu";
import SaveIndicator from "./SaveIndicator";
import SectionManager from "../../SectionManager/SectionManager";

/**
 * Three zones: what you are editing (left), how you are viewing it (centre),
 * what you can do with it (right). Occasional actions live behind AI and
 * project menus rather than each holding a permanent slot.
 */
function ToolbarIcon({ icon: Icon, label, onClick, disabled = false, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors
        ${active ? "bg-[#F1EEF9] text-[#2B0A5A]" : "text-[#5E5B6B] hover:bg-[#F4F2FA] hover:text-[#130225]"}
        disabled:cursor-not-allowed disabled:text-[#C9C6D4] disabled:hover:bg-transparent`}
    >
      <Icon size={16} strokeWidth={1.8} />
    </button>
  );
}

export default function TopNavbar() {
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.history.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);
  const isPreviewMode = useEditorStore((state) => state.isPreviewMode);
  const setPreviewMode = useEditorStore((state) => state.setPreviewMode);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-[#E7E8F4] bg-white/85 px-4 backdrop-blur-md">
      {/* What you are editing */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Logo />
        <span className="h-5 w-px bg-[#E7E8F4]" />
        <PageSwitcher />
        <SaveIndicator />
      </div>

      {/* How you are viewing it */}
      <DeviceSwitcher />

      {/* What you can do with it */}
      <div className="flex flex-1 items-center justify-end gap-1">
        <ToolbarIcon icon={Undo2} label="Undo" onClick={undo} disabled={!canUndo} />
        <ToolbarIcon icon={Redo2} label="Redo" onClick={redo} disabled={!canRedo} />
        <ToolbarIcon
          icon={Eye}
          label={isPreviewMode ? "Exit preview" : "Preview"}
          active={isPreviewMode}
          onClick={() => setPreviewMode(!isPreviewMode)}
        />

        <span className="mx-1 h-5 w-px bg-[#E7E8F4]" />

        <SectionManager trigger={{ icon: Plus, label: "Add" }} />
        <AIMenu />
        <ProjectMenu />

        <span className="mx-1 h-5 w-px bg-[#E7E8F4]" />

        <PublishControls />
        <UserProfile />
      </div>
    </header>
  );
}
