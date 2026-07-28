import React from "react";

/** Accepts an array, or a newline/comma separated string, since a model may send either. */
function toItems(items) {
  if (Array.isArray(items)) return items.map(String);
  if (typeof items === "string") {
    return items
      .split(/\r?\n|,/)
      .map((item) => item.replace(/^\s*[-*•]\s*/, "").trim())
      .filter(Boolean);
  }
  return [];
}

export default function List({ id, props, styles, hidden }) {
  if (hidden) return null;

  const items = toItems(props.items);
  const Tag = props.ordered ? "ol" : "ul";

  return (
    <Tag
      data-node-id={id}
      className={props.className || "flex flex-col gap-2 pl-6"}
      style={{
        listStyleType: props.ordered ? props.marker || "decimal" : props.marker || "disc",
        listStylePosition: "outside",
        ...styles,
      }}
    >
      {items.length === 0 ? (
        <li className="text-slate-400 italic">Empty list</li>
      ) : (
        items.map((item, index) => (
          <li key={index} style={{ color: props.itemColor || undefined }}>
            {item}
          </li>
        ))
      )}
    </Tag>
  );
}
