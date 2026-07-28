import React, { useState } from "react";
import ElementRenderer from "../ElementRenderer";
import EditableText from "@/components/studio/common/EditableText";

export default function Tabs({ id, sectionId, props, styles, hidden, children }) {
  const [activeTab, setActiveTab] = useState(0);

  if (hidden) return null;
  
  const tabs = props.tabs || [{ label: "Tab 1" }, { label: "Tab 2" }];

  return (
    <div data-node-id={id} className={`w-full ${props.className || ""}`} style={styles}>
      <div className="flex border-b">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === index 
                ? "border-b-2 border-violet-600 text-violet-600" 
                : "text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-6">
        <ElementRenderer children={children} sectionId={sectionId} />
      </div>
    </div>
  );
}
