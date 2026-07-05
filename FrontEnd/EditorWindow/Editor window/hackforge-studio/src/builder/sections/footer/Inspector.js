export default {
  typography: [
    { type: "text", label: "Heading", key: "title" },
    { type: "number", label: "Heading Size", key: "fontSize", min: 16, max: 72 },
    { type: "number", label: "Font Weight", key: "fontWeight", min: 100, max: 900 },
    { type: "text", label: "Subtitle", key: "subtitle" },
  ],
  colors: [
    { type: "color", label: "Heading", key: "color" },
    { type: "color", label: "Text", key: "textColor" },
    { type: "color", label: "Link Color", key: "linkColor" },
    { type: "color", label: "Background", key: "background" },
    { type: "color", label: "Border Color", key: "borderColor" },
  ],
  spacing: [
    { type: "slider", label: "Top Padding", key: "paddingTop", min: 0, max: 200 },
    { type: "slider", label: "Bottom Padding", key: "paddingBottom", min: 0, max: 200 },
  ],
};
