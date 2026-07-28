import { baseStyles } from "@/builder/utils/inspectorConfigs";

export default {
  ...baseStyles,
  content: [
    { type: "text", label: "Items (one per line)", key: "items" },
    { type: "select", label: "Style", key: "marker", options: ["disc", "circle", "square", "decimal", "none"] },
  ],
};
