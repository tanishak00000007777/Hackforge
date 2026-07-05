import React from "react";

export default function HoverLayer({ rect }) {
  if (!rect) return null;

  return (
    <div
      className="absolute border-[1.5px] border-violet-400 z-40 pointer-events-none"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
}
