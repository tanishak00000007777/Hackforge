import React from "react";

export default function Video({ id, props, styles, hidden }) {
  if (hidden) return null;
  return (
    <div data-node-id={id} className={`relative overflow-hidden w-full aspect-video bg-black ${props.className || ""}`} style={styles}>
      {props.url ? (
        <iframe
          src={props.url}
          className="w-full h-full"
          frameBorder="0"
          allow="autoplay; fullscreen"
          allowFullScreen
        ></iframe>
      ) : (
        <div className="flex items-center justify-center w-full h-full text-white/50">
          Video Placeholder
        </div>
      )}
    </div>
  );
}
