import React from "react";
import EditableText from "@/components/studio/common/EditableText";

export default function Paragraph({ id, sectionId, props, styles, hidden }) {
  if (hidden) return null;
  return (
    <EditableText data-node-id={id}
      as="p"
      componentId={id}
      sectionId={sectionId}
      property="text"
      value={props.text || "Paragraph text"}
      style={{ ...styles }}
      className={props.className || ""}
    />
  );
}
