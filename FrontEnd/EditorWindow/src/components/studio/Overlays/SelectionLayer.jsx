import React from "react";
import ResizeHandle from "./ResizeHandle";
import RotationHandle from "./RotationHandle";
import ComponentLabel from "./ComponentLabel";

export default function SelectionLayer({ id, rect }) {
  if (!rect) return null;

  return (
    <div
      className="absolute border-[1.5px] border-violet-500 z-50 pointer-events-none"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
    >
      <ComponentLabel id={id} />

      {/* Resize Handles - corners and edges */}
      <ResizeHandle position="top-left" />
      <ResizeHandle position="top" />
      <ResizeHandle position="top-right" />
      <ResizeHandle position="right" />
      <ResizeHandle position="bottom-right" />
      <ResizeHandle position="bottom" />
      <ResizeHandle position="bottom-left" />
      <ResizeHandle position="left" />

      {/* Rotation Handle */}
      <RotationHandle id={id} />
    </div>
  );
}
