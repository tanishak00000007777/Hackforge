import { useEditorStore } from "@/store/editorStore";
import { controlRegistry } from "@/builder/registry";

import { getResponsiveValue } from "@/builder/responsive/ResponsiveEngine";

export default function FieldRenderer({
  field,
  component,
  sectionId
}) {
  const updateComponent = useEditorStore((state) => state.updateComponent);
  const updateElement = useEditorStore((state) => state.updateElement);
  const device = useEditorStore((state) => state.device);

  const target = field.target || "props"; // "props", "styles", or "root"
  
  let value;
  if (target === "props") {
    value = component.props?.[field.key];
  } else if (target === "styles") {
    value = getResponsiveValue(component.styles, component.responsive, device, field.key);
  } else {
    value = component[field.key];
  }

  const update = (newValue) => {
    let parsedValue = newValue;
    if (target === "styles" && typeof newValue === "string" && /^-?[0-9]+(\.[0-9]+)?$/.test(newValue)) {
      const pxKeys = [
        "padding", "margin", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight", 
        "marginTop", "marginBottom", "marginLeft", "marginRight", "fontSize", "borderRadius", 
        "borderWidth", "width", "height", "minHeight", "minWidth", "maxWidth", "maxHeight", 
        "top", "bottom", "left", "right", "gap", "letterSpacing"
      ];
      if (pxKeys.includes(field.key)) {
        parsedValue = `${newValue}px`;
      }
    }

    let changes = {};
    if (target === "props") {
      changes = { props: { [field.key]: parsedValue } };
    } else if (target === "styles") {
      changes = { responsive: { [device]: { [field.key]: parsedValue } } };
    } else {
      changes = { [field.key]: parsedValue };
    }

    if (component.id === sectionId || !sectionId) {
      updateComponent(component.id, changes);
    } else {
      updateElement(sectionId, component.id, changes);
    }
  };

  const Control = controlRegistry[field.type];

  if (!Control) {
    return <div className="text-red-500 text-xs">Unknown control: {field.type}</div>;
  }

  return (
    <Control
      {...field}
      value={value}
      onChange={update}
    />
  );
}