import React from "react";

export default function Map({ id, props, styles, hidden }) {
  if (hidden) return null;
  return (
    <div data-node-id={id} className={`relative overflow-hidden w-full h-64 bg-slate-100 rounded-xl ${props.className || ""}`} style={styles}>
      {props.address ? (
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src={`https://www.google.com/maps/embed/v1/place?key=API_KEY&q=${encodeURIComponent(props.address)}`}
          allowFullScreen
        ></iframe>
      ) : (
        <div className="flex items-center justify-center w-full h-full text-slate-400">
          Map Placeholder
        </div>
      )}
    </div>
  );
}
