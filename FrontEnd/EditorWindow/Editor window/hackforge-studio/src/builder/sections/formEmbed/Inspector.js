export default {
  settings: [
    { type: "text", label: "Published Form URL", key: "formUrl" },
    { type: "slider", label: "Embed Height", key: "height", min: 400, max: 1200 },
  ],
  colors: [{ type: "color", label: "Background", key: "background" }],
  spacing: [
    { type: "slider", label: "Top Padding", key: "paddingTop", min: 0, max: 200 },
    { type: "slider", label: "Bottom Padding", key: "paddingBottom", min: 0, max: 200 },
  ],
};
