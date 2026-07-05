import React from "react";
import EditableText from "@/components/studio/common/EditableText";

export default function Badge({ id, sectionId, props, styles, hidden }) {
  if (hidden) return null;
  return (
    <div data-node-id={id}
      className={`inline-flex px-3 py-1 rounded-full font-semibold ${props.className || ""}`}
      style={{
        background: props.background || "#EDE9FE",
        color: props.color || "#6D28D9",
        fontSize: props.fontSize ? `${props.fontSize}px` : "14px",
        ...styles,
      }}
    >
      <EditableText
        as="span"
        componentId={id}
        sectionId={sectionId}
        property="text"
        value={props.text || "Badge"}
      />
    </div>
  );
}
