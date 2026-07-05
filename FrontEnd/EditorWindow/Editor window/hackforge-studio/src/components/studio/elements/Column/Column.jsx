import React from "react";
import ElementRenderer from "../ElementRenderer";

export default function Column({ id, sectionId, props, styles, hidden, children }) {
  if (hidden) return null;
  return (
    <div data-node-id={id}
      className={`flex flex-col ${props.className || ""}`}
      style={{
        gap: props.gap ? `${props.gap}px` : "16px",
        alignItems: props.alignItems || "stretch",
        justifyContent: props.justifyContent || "flex-start",
        flex: props.flex || "1",
        ...styles,
      }}
    >
      <ElementRenderer children={children} sectionId={sectionId} />
    </div>
  );
}
