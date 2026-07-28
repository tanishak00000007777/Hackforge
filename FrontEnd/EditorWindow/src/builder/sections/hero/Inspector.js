export default {
  typography: [
    { type: "text", label: "Badge", key: "badge" },
    { type: "number", label: "Badge Size", key: "badgeSize", min: 8, max: 48 },
    { type: "text", label: "Heading", key: "title" },
    { type: "number", label: "Heading Size", key: "fontSize", min: 16, max: 120 },
    { type: "number", label: "Weight", key: "fontWeight", min: 100, max: 900 },
    { type: "number", label: "Line Height", key: "lineHeight", min: 40, max: 120 },
    { type: "number", label: "Letter Spacing", key: "letterSpacing", min: -10, max: 20 },
    { type: "text", label: "Subtitle", key: "subtitle" },
    { type: "number", label: "Subtitle Size", key: "subtitleSize", min: 12, max: 48 },
    { type: "text", label: "Primary Button", key: "primaryButton" },
    { type: "text", label: "Secondary Button", key: "secondaryButton" },
  ],
  colors: [
    { type: "color", label: "Heading", key: "color" },
    { type: "color", label: "Subtitle", key: "subtitleColor" },
    { type: "color", label: "Badge", key: "badgeColor" },
    { type: "color", label: "Button", key: "buttonColor" },
    { type: "color", label: "Background", key: "background" },
    { type: "color", label: "Badge Background", key: "badgeBackground" },
    { type: "color", label: "Secondary Border", key: "secondaryButtonBorder" },
  ],
  spacing: [
    { type: "slider", label: "Top Padding", key: "paddingTop", min: 0, max: 250 },
    { type: "slider", label: "Bottom Padding", key: "paddingBottom", min: 0, max: 250 },
    { type: "slider", label: "Button Radius", key: "buttonRadius", min: 0, max: 40 },
  ],
};
