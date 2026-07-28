import { MoreHorizontal, LayoutTemplate, Upload, Download, RotateCcw } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { exportTemplate, importTemplate } from "@/builder/utils/TemplateManager";
import { duplicateNode } from "@/builder/factories/coreFactory";
import MenuButton, { MenuItem, MenuDivider } from "./MenuButton";

/**
 * Everything that used to sit in the toolbar as its own icon: templates,
 * import, export, reset. These are occasional actions, so they belong one
 * click away rather than permanently on screen.
 */
export default function ProjectMenu() {
  const setTemplatesModalOpen = useEditorStore((state) => state.setTemplatesModalOpen);
  const loadProjectTemplate = useEditorStore((state) => state.loadProjectTemplate);
  const addComponent = useEditorStore((state) => state.addComponent);
  const resetProject = useEditorStore((state) => state.resetProject);

  const handleExport = () => {
    const { getPages, globalTheme } = useEditorStore.getState();
    exportTemplate(
      { type: "website", name: "My HackForge Website", data: { pages: getPages(), globalTheme } },
      "hackforge-website.json",
    );
  };

  const handleImport = async () => {
    try {
      const template = await importTemplate();
      if (!template?.type) {
        alert("That file is not a HackForge template.");
        return;
      }

      if (template.type === "section") {
        addComponent(duplicateNode(template.data));
        return;
      }

      if (!window.confirm("Importing a website replaces the current canvas. Continue?")) return;

      // Website exports carry pages; older files carry a flat component list.
      const components = (template.data.pages?.[0]?.components || template.data.components || []).map(duplicateNode);
      loadProjectTemplate({ components, globalTheme: template.data.globalTheme });
    } catch (err) {
      if (err !== "No file selected") {
        alert("That template could not be imported.");
        console.error(err);
      }
    }
  };

  return (
    <MenuButton icon={MoreHorizontal} title="Project actions">
      <MenuItem icon={LayoutTemplate} label="Templates" onClick={() => setTemplatesModalOpen(true)} />
      <MenuDivider />
      <MenuItem icon={Upload} label="Import…" onClick={handleImport} />
      <MenuItem icon={Download} label="Export JSON" onClick={handleExport} />
      <MenuDivider />
      <MenuItem
        icon={RotateCcw}
        label="Start over"
        onClick={() => window.confirm("Clear this page and start over?") && resetProject()}
      />
    </MenuButton>
  );
}
