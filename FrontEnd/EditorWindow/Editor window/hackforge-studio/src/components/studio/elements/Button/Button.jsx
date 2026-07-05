import React from "react";
import EditableText from "@/components/studio/common/EditableText";

export default function Button({ id, sectionId, props, styles, hidden }) {
  if (hidden) return null;
  return (
    <button data-node-id={id}
      className={props.className || "px-8 py-4 font-bold transition-all duration-200"}
      style={{ ...styles }}
    >
      <EditableText
        as="span"
        componentId={id}
        sectionId={sectionId}
        property="text"
        value={props.text || "Button"}
      />
    </button>
  );
}
