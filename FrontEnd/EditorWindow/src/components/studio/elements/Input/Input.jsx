import React from "react";
import EditableText from "@/components/studio/common/EditableText";

export default function Input({ id, sectionId, props, styles, hidden }) {
  if (hidden) return null;
  return (
    <div data-node-id={id} className={`flex flex-col gap-2 ${props.className || ""}`} style={styles}>
      {props.label && (
        <label className="text-sm font-medium text-slate-700">
          <EditableText
            as="span"
            componentId={id}
            sectionId={sectionId}
            property="label"
            value={props.label}
          />
        </label>
      )}
      <input
        type={props.inputType || "text"}
        placeholder={props.placeholder || "Enter value..."}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500 transition-all"
        style={{
          background: props.background || "#FFFFFF",
          color: props.color || "#0F172A",
        }}
        disabled
      />
    </div>
  );
}
