import { Eye, Save, Download, Upload } from "lucide-react";
import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { exportTemplate, importTemplate } from "@/builder/utils/TemplateManager";
import { duplicateNode } from "@/builder/factories/coreFactory";
import PublishModal from "@/components/studio/Publish/PublishModal";

export default function PublishControls() {
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const components = useEditorStore((state) => state.components);
  const globalTheme = useEditorStore((state) => state.globalTheme);
  const loadProjectTemplate = useEditorStore((state) => state.loadProjectTemplate);
  const addComponent = useEditorStore((state) => state.addComponent);

  const handleExport = () => {
    const projectData = {
      type: "website",
      name: "My HackForge Website",
      data: {
        components,
        globalTheme,
      }
    };
    exportTemplate(projectData, "hackforge-website.json");
  };

  const handleImport = async () => {
    try {
      const template = await importTemplate();
      if (!template || !template.type) {
        alert("Invalid template file");
        return;
      }

      if (template.type === "section") {
        // Deep clone to regenerate IDs
        const newSection = duplicateNode(template.data);
        addComponent(newSection);
      } else if (template.type === "page" || template.type === "website") {
        const confirm = window.confirm("Importing a website template will overwrite your current canvas. Continue?");
        if (confirm) {
          // Deep clone all components
          const clonedComponents = template.data.components.map(c => duplicateNode(c));
          loadProjectTemplate({
            components: clonedComponents,
            globalTheme: template.data.globalTheme
          });
        }
      }
    } catch (err) {
      if (err !== "No file selected") {
        alert("Failed to import template");
        console.error(err);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleImport}
        className="flex items-center gap-2 rounded-xl border border-[#D8DAE5] bg-white px-2 py-2 text-sm font-medium text-[#383547] transition hover:bg-[#F8F8FC]"
        title="Import Template JSON"
      >
        <Upload size={16} />
      </button>

      <button
        onClick={handleExport}
        className="flex items-center gap-2 rounded-xl border border-[#D8DAE5] bg-white px-2 py-2 text-sm font-medium text-[#383547] transition hover:bg-[#F8F8FC]"
        title="Export Website JSON"
      >
        <Download size={16} />
      </button>

      <button className="flex items-center gap-2 rounded-xl border border-[#D8DAE5] bg-white px-3 py-2 text-sm font-medium text-[#383547] transition hover:bg-[#F8F8FC]">
        <Save size={16} />
        Save
      </button>

      <button 
        onClick={() => setIsPublishModalOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-[#130225] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#261045]"
      >
        <Eye size={16} />
        Publish
      </button>

      <PublishModal 
        isOpen={isPublishModalOpen} 
        onClose={() => setIsPublishModalOpen(false)} 
      />
    </div>
  );
}