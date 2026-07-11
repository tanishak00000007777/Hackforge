import { useEffect } from "react";
import StudioLayout from "@/layouts/StudioLayout";
import { useEditorStore } from "@/store/editorStore";

export default function App() {
  const loadProjectTemplate = useEditorStore((state) => state.loadProjectTemplate);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("hackforge-studio-project"));
      if (saved?.components) loadProjectTemplate(saved);
    } catch {
      localStorage.removeItem("hackforge-studio-project");
    }
  }, [loadProjectTemplate]);

  return <StudioLayout />;
}
