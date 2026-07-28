import React from "react";

export default function DropLayer({ rect }) {
  if (!rect) return null;

  // Render a blue line for 'before' and 'after'
  // Render a blue dashed box for 'inside'
  
  if (rect.position === 'inside') {
    return (
      <div
        className="absolute border-[2px] border-dashed border-blue-500 bg-blue-500/10 z-40 pointer-events-none"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      />
    );
  }

  const isBefore = rect.position === 'before';
  return (
    <div
      className="absolute bg-blue-500 z-40 pointer-events-none"
      style={{
        top: isBefore ? rect.top - 2 : rect.top + rect.height,
        left: rect.left,
        width: rect.width,
        height: 4,
      }}
    >
      <div className="absolute -left-1.5 -top-1 w-3 h-3 rounded-full bg-white border-2 border-blue-500" />
      <div className="absolute -right-1.5 -top-1 w-3 h-3 rounded-full bg-white border-2 border-blue-500" />
    </div>
  );
}
