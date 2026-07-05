import React from "react";

export default function Image({ id, props, styles, hidden }) {
  if (hidden) return null;
  return (
    <img data-node-id={id}
      src={props.src || "https://via.placeholder.com/150"}
      alt={props.alt || "Image"}
      className={props.className || ""}
      style={{ ...styles }}
    />
  );
}
