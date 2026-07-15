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
          h-[calc(100vh-64px)]
          overflow-hidden
          bg-[#FCFAFF]
        "
      >
        {!isPreviewMode && <LeftSidebar />}

        <Canvas />

        {!isPreviewMode && <RightPanel />}
      </main>
    </>
  );
}
