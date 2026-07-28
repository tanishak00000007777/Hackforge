import React from "react";
import ElementRenderer from "../ElementRenderer";

export default function Container({ id, sectionId, props, styles, hidden, children }) {
  if (hidden) return null;
  return (
    <div data-node-id={id}
      className={`mx-auto w-full ${props.className || ""}`}
      style={{ maxWidth: props.maxWidth || "1200px", ...styles }}
    >
      <ElementRenderer children={children} sectionId={sectionId} />
    </div>
  );
}
