export default {
  typography: [
    { type: "text", label: "Heading", key: "title" },
    { type: "number", label: "Heading Size", key: "fontSize", min: 24, max: 72 },
    { type: "number", label: "Font Weight", key: "fontWeight", min: 100, max: 900 },
    { type: "text", label: "Description", key: "subtitle" },
    { type: "number", label: "Description Size", key: "subtitleSize", min: 14, max: 32 },
  ],
  colors: [
    { type: "color", label: "Heading", key: "color" },
    { type: "color", label: "Description", key: "subtitleColor" },
    { type: "color", label: "Background", key: "background" },
    { type: "color", label: "Card Background", key: "cardBackground" },
  ],
  spacing: [
    { type: "slider", label: "Top Padding", key: "paddingTop", min: 0, max: 200 },
    { type: "slider", label: "Bottom Padding", key: "paddingBottom", min: 0, max: 200 },
    { type: "slider", label: "Gap", key: "gap", min: 8, max: 80 },
  ],
};
