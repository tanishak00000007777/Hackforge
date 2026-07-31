import { useEditorStore } from "@/store/editorStore";
import LayerItem from "./LayerItem";

export default function LayersPanel() {
  const components = useEditorStore(
    (state) => state.components
  );

  return (
    <div className="h-full flex flex-col">

      <div className="flex-1 overflow-y-auto px-3 pb-10 space-y-1">

        {components.map((component) => (
          <LayerItem
            key={component.id}
            component={component}
          />
        ))}

      </div>

    </div>
  );
}