// ===========================================
// Responsive Engine
// ===========================================

export const DEVICES = {
  desktop: "desktop",
  tablet: "tablet",
  mobile: "mobile",
};

/**
 * Computes the final merged styles by cascading Desktop -> Tablet -> Mobile.
 * @param {Object} baseStyles - Legacy base styles (optional fallback)
 * @param {Object} responsive - The responsive dictionary { desktop, tablet, mobile }
 * @param {string} currentDevice - "desktop" | "tablet" | "mobile"
 * @returns {Object} Computed flattened style object
 */
export function computeStyles(baseStyles = {}, responsive = {}, currentDevice = "desktop") {
  const merged = { ...baseStyles };
  
  if (responsive.desktop) {
    Object.assign(merged, responsive.desktop);
  }
  
  if (currentDevice === "tablet" || currentDevice === "mobile") {
    if (responsive.tablet) {
      Object.assign(merged, responsive.tablet);
    }
  }

  if (currentDevice === "mobile") {
    if (responsive.mobile) {
      Object.assign(merged, responsive.mobile);
    }
  }

  return merged;
}

/**
 * Gets the specific value for a property, following the cascade.
 */
export function getResponsiveValue(baseStyles = {}, responsive = {}, currentDevice = "desktop", key) {
  const computed = computeStyles(baseStyles, responsive, currentDevice);
  return computed[key];
}