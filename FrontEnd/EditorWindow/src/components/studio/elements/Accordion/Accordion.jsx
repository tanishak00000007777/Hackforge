import React, { useState } from "react";
import EditableText from "@/components/studio/common/EditableText";
import ElementRenderer from "../ElementRenderer";

export default function Accordion({ id, sectionId, props, styles, hidden, children }) {
  const [open, setOpen] = useState(false);
  
  if (hidden) return null;
  return (
    <div data-node-id={id} className={`border rounded-xl mb-4 ${props.className || ""}`} style={styles}>
      <div 
        className="p-4 font-bold cursor-pointer flex justify-between items-center"
        onClick={() => setOpen(!open)}
        style={{ background: props.headerBackground || "transparent" }}
      >
        <EditableText
          as="span"
          componentId={id}
          sectionId={sectionId}
          property="title"
          value={props.title || "Accordion Title"}
        />
        <span>{open ? "-" : "+"}</span>
      </div>
      {open && (
        <div className="p-4 border-t">
          <ElementRenderer children={children} sectionId={sectionId} />
        </div>
      )}
    </div>
  );
}
