import React from "react";
import ElementRenderer from "../ElementRenderer";

export default function Card({ id, sectionId, props, styles, hidden, children }) {
  if (hidden) return null;
  return (
    <div data-node-id={id}
      className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all ${props.className || ""}`}
      style={{
        background: props.background || "#FFFFFF",
        padding: props.padding ? `${props.padding}px` : "24px",
        ...styles,
      }}
    >
      <ElementRenderer children={children} sectionId={sectionId} />
    </div>
  );
}
