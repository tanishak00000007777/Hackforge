// ===========================================
// Typography Style Engine
// ===========================================

export function getHeadingStyle(props = {}) {
  return {
    fontFamily: props.fontFamily ?? "var(--token-typography-fontFamily)",

    fontSize: props.fontSize ? `${props.fontSize}px` : "var(--token-typography-headingSize)",

    fontWeight: props.fontWeight ?? "var(--token-typography-headingWeight)",

    lineHeight: props.lineHeight ? `${props.lineHeight}px` : "var(--token-typography-headingLineHeight)",

    letterSpacing: props.letterSpacing ? `${props.letterSpacing}px` : "var(--token-typography-headingLetterSpacing)",

    color: props.color ?? "var(--token-color-text)",
  };
}

export function getSubtitleStyle(props = {}) {
  return {
    fontFamily: props.fontFamily ?? "var(--token-typography-fontFamily)",

    fontSize: props.subtitleSize ? `${props.subtitleSize}px` : "var(--token-typography-subtitleSize)",

    color: props.subtitleColor ?? "var(--token-color-subtitle)",
  };
}

export function getBadgeStyle(props = {}) {
  return {
    background: props.badgeBackground ?? "var(--token-color-badgeBg)",

    color: props.badgeColor ?? "var(--token-color-badgeText)",

    fontFamily: props.fontFamily ?? "var(--token-typography-fontFamily)",

    fontSize: props.badgeSize ? `${props.badgeSize}px` : "var(--token-typography-badgeSize)",
  };
}