import React from "react";
import ElementRenderer from "../ElementRenderer";

export default function Grid({ id, sectionId, props, styles, hidden, children }) {
  if (hidden) return null;
  return (
    <div data-node-id={id}
      className={`grid ${props.className || ""}`}
      style={{
        gridTemplateColumns: props.columns ? `repeat(${props.columns}, minmax(0, 1fr))` : "repeat(1, minmax(0, 1fr))",
        gap: props.gap ? `${props.gap}px` : "16px",
        ...styles,
      }}
    >
      <ElementRenderer children={children} sectionId={sectionId} />
    </div>
  );
}
