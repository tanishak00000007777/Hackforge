import React from "react";
import ElementRenderer from "../ElementRenderer";

export default function Row({ id, sectionId, props, styles, hidden, children }) {
  if (hidden) return null;
  return (
    <div data-node-id={id}
      className={`flex ${props.className || "flex-row flex-wrap"}`}
      style={{
        gap: props.gap ? `${props.gap}px` : "16px",
        alignItems: props.alignItems || "center",
        justifyContent: props.justifyContent || "flex-start",
        ...styles,
      }}
    >
      <ElementRenderer children={children} sectionId={sectionId} />
    </div>
  );
}
