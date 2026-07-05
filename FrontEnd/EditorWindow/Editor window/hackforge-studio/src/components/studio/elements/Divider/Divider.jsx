import React from "react";

export default function Divider({ id, props, styles, hidden }) {
  if (hidden) return null;
  return (
    <hr data-node-id={id}
      className={props.className || "w-full my-4"}
      style={{
        borderColor: props.color || "#E2E8F0",
        borderWidth: props.thickness ? `${props.thickness}px` : "1px",
        borderStyle: props.style || "solid",
        ...styles,
      }}
    />
  );
}
