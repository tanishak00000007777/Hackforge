import React from "react";
import { elementRegistry } from "@/builder/registry";
import { useEditorStore } from "@/store/editorStore";
import { computeStyles } from "@/builder/responsive/ResponsiveEngine";

export default function ElementRenderer({ children, sectionId }) {
  const device = useEditorStore((state) => state.device);

  if (!children || !Array.isArray(children)) return null;

  return (
    <>
      {children.map((child, index) => {
        const registryItem = elementRegistry[child.type];
        
        if (!registryItem) {
          console.warn(`ElementRenderer: No registry entry found for type "${child.type}"`);
          return null;
        }

        const Component = registryItem.component;
        
        const responsiveObj = child.responsive || { desktop: {}, tablet: {}, mobile: {} };
        const computedStyles = computeStyles(child.styles || {}, responsiveObj, device);

        return (
          <Component
            key={child.id || index}
            id={child.id}
            sectionId={sectionId}
            type={child.type}
            props={child.props || {}}
            styles={computedStyles}
            responsive={responsiveObj}
            locked={child.locked}
            hidden={child.hidden}
            children={child.children || []}
          />
        );
      })}
    </>
  );
}
