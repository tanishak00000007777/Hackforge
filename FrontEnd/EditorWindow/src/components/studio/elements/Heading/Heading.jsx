import React from "react";
import EditableText from "@/components/studio/common/EditableText";

export default function Heading({ id, sectionId, props, styles, hidden }) {
  if (hidden) return null;
  return (
    <EditableText data-node-id={id}
      as={props.tag || "h1"}
      componentId={id}
      sectionId={sectionId}
      property="text"
      value={props.text || "Heading"}
      style={{ ...styles }}
      className={props.className || ""}
    />
  );
}
