export default {
  typography: [
    { type: "text", label: "Heading", key: "title" },
    { type: "number", label: "Heading Size", key: "fontSize", min: 24, max: 72 },
    { type: "number", label: "Font Weight", key: "fontWeight", min: 100, max: 900 },
  ],
  colors: [
    { type: "color", label: "Heading", key: "color" },
    { type: "color", label: "Background", key: "background" },
    { type: "color", label: "Timeline Line", key: "timelineColor" },
    { type: "color", label: "Dot Color", key: "dotColor" },
    { type: "color", label: "Event Title", key: "eventTitleColor" },
    { type: "color", label: "Event Description", key: "eventDescColor" },
    { type: "color", label: "Time Badge BG", key: "timeBackground" },
    { type: "color", label: "Time Text", key: "timeColor" },
  ],
  spacing: [
    { type: "slider", label: "Top Padding", key: "paddingTop", min: 0, max: 200 },
    { type: "slider", label: "Bottom Padding", key: "paddingBottom", min: 0, max: 200 },
  ],
};
