export const baseStyles = {
  spacing: [
    { key: "padding", label: "Padding", type: "text", target: "styles", placeholder: "e.g., 20px" },
    { key: "margin", label: "Margin", type: "text", target: "styles", placeholder: "e.g., auto" }
  ],
  layout: [
    { key: "width", label: "Width", type: "text", target: "styles", placeholder: "auto, 100%, 300px" },
    { key: "height", label: "Height", type: "text", target: "styles", placeholder: "auto, 100vh" },
    { key: "display", label: "Display", type: "select", options: ["block", "inline-block", "flex", "grid", "inline"], target: "styles" },
  ],
  colors: [
    { key: "backgroundColor", label: "Background", type: "color", target: "styles" },
    { key: "color", label: "Text Color", type: "color", target: "styles" }
  ],
  borders: [
    { key: "borderWidth", label: "Width", type: "text", target: "styles", placeholder: "e.g., 1px" },
    { key: "borderStyle", label: "Style", type: "select", options: ["none", "solid", "dashed", "dotted"], target: "styles" },
    { key: "borderColor", label: "Color", type: "color", target: "styles" },
    { key: "borderRadius", label: "Radius", type: "text", target: "styles", placeholder: "e.g., 8px" }
  ],
  effects: [
    { key: "boxShadow", label: "Shadow", type: "text", target: "styles", placeholder: "0px 4px 10px rgba(0,0,0,0.1)" },
    { key: "opacity", label: "Opacity", type: "slider", min: 0, max: 1, target: "styles" }
  ],
  visibility: [
    { key: "hidden", label: "Hidden (true/false)", type: "select", options: ["false", "true"], target: "root" },
    { key: "locked", label: "Locked (true/false)", type: "select", options: ["false", "true"], target: "root" }
  ]
};

export const typographyStyles = [
  { key: "fontSize", label: "Font Size", type: "text", target: "styles", placeholder: "e.g., 16px, 1.5rem" },
  { key: "fontWeight", label: "Font Weight", type: "select", options: ["normal", "bold", "300", "400", "500", "600", "700", "800", "900"], target: "styles" },
  { key: "textAlign", label: "Alignment", type: "select", options: ["left", "center", "right", "justify"], target: "styles" }
];

export const flexStyles = [
  { key: "flexDirection", label: "Direction", type: "select", options: ["row", "column", "row-reverse", "column-reverse"], target: "styles" },
  { key: "justifyContent", label: "Justify", type: "select", options: ["flex-start", "center", "flex-end", "space-between", "space-around"], target: "styles" },
  { key: "alignItems", label: "Align", type: "select", options: ["stretch", "flex-start", "center", "flex-end", "baseline"], target: "styles" },
  { key: "gap", label: "Gap", type: "text", target: "styles", placeholder: "e.g., 16px" }
];

export const getBaseInspector = () => ({ ...baseStyles });
