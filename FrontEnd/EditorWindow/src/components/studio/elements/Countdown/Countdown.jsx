import React from "react";

export default function Countdown({ id, props, styles, hidden }) {
  if (hidden) return null;
  return (
    <div data-node-id={id} className={`flex gap-4 ${props.className || ""}`} style={styles}>
      {["Days", "Hours", "Minutes", "Seconds"].map((label) => (
        <div key={label} className="flex flex-col items-center">
          <div className="text-4xl font-bold">00</div>
          <div className="text-sm opacity-70">{label}</div>
        </div>
      ))}
    </div>
  );
}
