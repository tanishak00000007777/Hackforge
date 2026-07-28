// ===========================================
// Button Style Engine
// ===========================================

export function getPrimaryButtonStyle(props = {}) {
  return {
    background: props.buttonColor ?? "var(--token-color-primary)",

    borderRadius: props.buttonRadius ? `${props.buttonRadius}px` : "var(--token-radius-button)",

    fontSize: props.buttonFontSize ? `${props.buttonFontSize}px` : "var(--token-typography-buttonSize)",

    fontFamily: props.fontFamily ?? "var(--token-typography-fontFamily)",
  };
}

export function getSecondaryButtonStyle(props = {}) {
  return {
    borderColor: props.secondaryButtonBorder ?? "var(--token-color-primary)",

    color: props.secondaryButtonBorder ?? "var(--token-color-primary)",

    borderRadius: props.buttonRadius ? `${props.buttonRadius}px` : "var(--token-radius-button)",

    fontSize: props.buttonFontSize ? `${props.buttonFontSize}px` : "var(--token-typography-buttonSize)",

    fontFamily: props.fontFamily ?? "var(--token-typography-fontFamily)",
  };
}