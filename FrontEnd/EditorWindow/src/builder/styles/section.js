// ===========================================
// Section Style Engine
// ===========================================

export function getSectionStyle(props = {}) {
  return {
    background: props.background ?? "var(--token-color-background)",

    paddingTop: props.paddingTop ? `${props.paddingTop}px` : "112px",

    paddingBottom: props.paddingBottom ? `${props.paddingBottom}px` : "112px",
  };
}