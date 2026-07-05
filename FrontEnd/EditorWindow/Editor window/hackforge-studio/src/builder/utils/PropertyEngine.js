// ===========================================
// Property Engine
// Centralized property access
// ===========================================

export function getProperty(props, key, fallback = null) {
  const value = props?.[key];

  if (value === undefined || value === null) {
    return fallback;
  }

  return value;
}

export function setProperty(updateComponent, componentId, key, value) {
  updateComponent(componentId, {
    [key]: value,
  });
}

export function getTypography(props) {
  return {
    fontFamily: getProperty(props, "fontFamily", "Inter"),
    fontSize:getProperty(props,"fontSize",{
        desktop:72,
        tablet:60,
        mobile:46,
    }),
    fontWeight: getProperty(props, "fontWeight", 900),
    lineHeight: getProperty(props, "lineHeight", 78),
    letterSpacing: getProperty(props, "letterSpacing", -2),
    color: getProperty(props, "color", "#171C5A"),
  };
}

export function getSubtitle(props) {
  return {
    fontSize: getProperty(props, "subtitleSize", 28),
    color: getProperty(props, "subtitleColor", "#64748B"),
  };
}

export function getButtons(props) {
  return {
    radius: getProperty(props, "buttonRadius", 12),
    primaryColor: getProperty(props, "buttonColor", "#2B0A5A"),
    secondaryBorder: getProperty(
      props,
      "secondaryButtonBorder",
      "#2D0B59"
    ),
    fontSize: getProperty(props, "buttonFontSize", 18),
  };
}