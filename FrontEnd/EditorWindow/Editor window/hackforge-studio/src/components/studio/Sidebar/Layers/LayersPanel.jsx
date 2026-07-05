import { useEditorStore } from "@/store/editorStore";
import LayerItem from "./LayerItem";

export default function LayersPanel() {
  const components = useEditorStore(
    (state) => state.components
  );

  return (
    <div className="h-full flex flex-col">

      <div className="px-4 py-4 border-b">
        <h2 className="font-bold text-lg">
          Layers
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">

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