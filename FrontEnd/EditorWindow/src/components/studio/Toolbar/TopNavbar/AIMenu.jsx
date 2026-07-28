import { Sparkles, MessageSquare, Wand2 } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import MenuButton, { MenuItem } from "./MenuButton";

/**
 * One AI entry point. Two separate labelled buttons in the toolbar said the
 * same word twice and never explained the difference; a single menu names both
 * surfaces and says what each is for.
 */
export default function AIMenu() {
  const isCopilotOpen = useEditorStore((state) => state.isCopilotOpen);
  const setCopilotOpen = useEditorStore((state) => state.setCopilotOpen);
  const isAIEditorOpen = useEditorStore((state) => state.isAIEditorOpen);
  const setAIEditorOpen = useEditorStore((state) => state.setAIEditorOpen);

  const anyOpen = isCopilotOpen || isAIEditorOpen;

  return (
    <div className={anyOpen ? "rounded-lg ring-1 ring-violet-200" : ""}>
      <MenuButton label="AI" icon={Sparkles} title="AI tools">
        <MenuItem
          icon={MessageSquare}
          label="Assistant"
          hint="edit this page"
          active={isCopilotOpen}
          onClick={() => {
            setAIEditorOpen(false);
            setCopilotOpen(!isCopilotOpen);
          }}
        />
        <MenuItem
          icon={Wand2}
          label="AI Editing"
          hint="whole site"
          active={isAIEditorOpen}
          onClick={() => {
            setCopilotOpen(false);
            setAIEditorOpen(!isAIEditorOpen);
          }}
        />
      </MenuButton>
    </div>
  );
}
