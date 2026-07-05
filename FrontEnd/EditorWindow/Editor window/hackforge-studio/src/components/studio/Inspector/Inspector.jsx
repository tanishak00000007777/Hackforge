import { useMemo } from "react";

import { useEditorStore } from "@/store/editorStore";
import { schemaRegistry } from "@/builder/registry";

import Section from "./Section";
import FieldRenderer from "./FieldRenderer";
import SectionActions from "./SectionActions";
import { componentRegistry, elementRegistry } from "@/builder/registry";

// Helper to recursively find a node and its root sectionId
function findDeepNode(nodes, targetId, currentSectionId = null) {
  for (const node of nodes) {
    const sectionId = currentSectionId || node.id;
    if (node.id === targetId) return { node, sectionId };
    
    if (node.children && node.children.length > 0) {
      const found = findDeepNode(node.children, targetId, sectionId);
      if (found) return found;
    }
  }
  return null;
}

export default function Inspector() {
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const selectedId = selectedIds[0];

  const components = useEditorStore((state) => state.components);

  const selectedData = useMemo(() => {
    if (!selectedId) return null;
    return findDeepNode(components, selectedId);
  }, [components, selectedId]);

  const selected = selectedData?.node;
  const sectionId = selectedData?.sectionId;

  if (!selected) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="text-center">

          <div className="mb-4 text-5xl">🎨</div>

          <h2 className="text-lg font-semibold text-slate-800">
            No Component Selected
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Select a section on the canvas to edit its properties.
          </p>

        </div>
      </div>
    );
  }

  const inspectorConfig =
    componentRegistry[selected.type]?.inspector ||
    elementRegistry[selected.type]?.inspector;

  if (!inspectorConfig) {
    return (
      <div className="p-6 text-sm text-red-500">
        No inspector found for "{selected.type}".
      </div>
    );
  }

  const groups = Object.entries(inspectorConfig);

  return (
    <div className="space-y-10">
      {selected.id === sectionId && <SectionActions section={selected} />}
      
      {groups.map(([groupName, fields]) => (
        <Section
          key={groupName}
          title={
            groupName.charAt(0).toUpperCase() +
            groupName.slice(1)
          }
        >
          <div className="space-y-5">
            {fields.map((field) => (
              <FieldRenderer
                key={field.key}
                field={field}
                component={selected}
                sectionId={sectionId}
              />
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}