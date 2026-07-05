import { useEditorStore } from "@/store/editorStore";
import Logo from "./Logo";
import Navigation from "./Navigation";
import DeviceSwitcher from "./DeviceSwitcher";
import HistoryControls from "./HistoryControls";
import PublishControls from "./PublishControls";
import UserProfile from "./UserProfile";
import SectionManager from "../../SectionManager/SectionManager";
import { Sparkles } from "lucide-react";

export default function TopNavbar() {
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.history.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);
  const isCopilotOpen = useEditorStore((state) => state.isCopilotOpen);
  const setCopilotOpen = useEditorStore((state) => state.setCopilotOpen);

  return (
    <header
      className="
      sticky
      top-0
      z-50
      flex
      h-16
      items-center
      justify-between
      border-b
      border-[#E7E8F4]/60
      bg-[#FCFBFE]/90
      px-6
      backdrop-blur-md
    "
    >
      <div className="flex items-center gap-10">
        <Logo />
        <Navigation />
      </div>

      <div className="flex items-center gap-4">
        <SectionManager />
        
        <HistoryControls 
          onUndo={undo} 
          onRedo={redo} 
          canUndo={canUndo} 
          canRedo={canRedo} 
        />

        <DeviceSwitcher />

        <PublishControls />

        <button 
          onClick={() => setCopilotOpen(!isCopilotOpen)}
          className={`
            flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold transition-all border
            ${isCopilotOpen 
              ? "bg-violet-50 text-violet-600 border-violet-200 shadow-inner" 
              : "bg-white text-slate-700 border-[#D8DAE5] hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200"
            }
          `}
        >
          <Sparkles size={12} className={isCopilotOpen ? "text-violet-600" : "text-violet-500"} />
          ForgeAI Assistant
        </button>

        <UserProfile />
      </div>
    </header>
  );
}