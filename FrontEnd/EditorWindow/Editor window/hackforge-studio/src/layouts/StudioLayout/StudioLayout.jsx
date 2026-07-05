import TopNavbar from "@/components/studio/Toolbar/TopNavbar";
import LeftSidebar from "@/components/studio/Sidebar";
import Canvas from "@/components/studio/Canvas";
import RightPanel from "@/components/studio/Inspector";
import TemplatesModal from "@/components/studio/Templates/TemplatesModal";
import AICopilot from "@/components/studio/AI/AICopilot";
import DragPreview from "@/components/studio/DragDrop/DragPreview";
import { useEditorStore } from "@/store/editorStore";

export default function StudioLayout() {
  const isCopilotOpen = useEditorStore((state) => state.isCopilotOpen);
  const setCopilotOpen = useEditorStore((state) => state.setCopilotOpen);
  const isPreviewMode = useEditorStore((state) => state.isPreviewMode);

  return (
    <>
      <TopNavbar />
      <TemplatesModal />
      <AICopilot isOpen={isCopilotOpen} onClose={() => setCopilotOpen(false)} />
      <DragPreview />

      <main
        className="
          flex
          h-[calc(100vh-76px)]
          overflow-hidden
          bg-[#FCFAFF]
        "
      >
        {!isPreviewMode && (
          <aside className="w-[340px] min-w-[340px] border-r border-[#E7E8F4]/60 bg-[#FCFBFE] overflow-y-auto transition-all">
            <LeftSidebar />
          </aside>
        )}

        <Canvas />

        {!isPreviewMode && <RightPanel />}
      </main>
    </>
  );
}