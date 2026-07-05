// ===========================================
// Code Generator Utility
// Generates clean JSX strings from the internal editor tree
// ===========================================

function camelToKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function objectToStyleString(styles) {
  if (!styles || Object.keys(styles).length === 0) return "{}";
  const lines = Object.entries(styles)
    .map(([key, value]) => `      ${key}: '${value}'`)
    .join(",\n");
  return `{\n${lines}\n    }`;
}

export function generateCSS(globalTheme) {
  if (!globalTheme) return "";

  const rootVars = [];
  
  // Typography
  if (globalTheme.typography) {
    Object.entries(globalTheme.typography).forEach(([key, val]) => {
      rootVars.push(`  --token-typography-${key}: ${val};`);
    });
  }

  // Colors
  if (globalTheme.colors) {
    Object.entries(globalTheme.colors).forEach(([key, val]) => {
      rootVars.push(`  --token-color-${key}: ${val};`);
    });
  }

  // Spacing
  if (globalTheme.spacing) {
    Object.entries(globalTheme.spacing).forEach(([key, val]) => {
      rootVars.push(`  --token-spacing-${key}: ${val};`);
    });
  }

  // Radius
  if (globalTheme.radius) {
    Object.entries(globalTheme.radius).forEach(([key, val]) => {
      rootVars.push(`  --token-radius-${key}: ${val};`);
    });
  }
  
  // Shadows
  if (globalTheme.shadows) {
    Object.entries(globalTheme.shadows).forEach(([key, val]) => {
      rootVars.push(`  --token-shadow-${key}: ${val};`);
    });
  }

  return `
/* Auto-generated Global Theme CSS */
:root {
${rootVars.join("\n")}
}

body {
  margin: 0;
  font-family: var(--token-typography-fontFamily), sans-serif;
  background-color: var(--token-color-background);
  color: var(--token-color-text);
}
`;
}

export function generateJSX(components) {
  function renderNode(node, indentLevel = 4) {
    const indent = " ".repeat(indentLevel);
    
    // Fallback tag mapping
    let tag = "div";
    if (node.type === "heading") tag = "h1";
    if (node.type === "paragraph") tag = "p";
    if (node.type === "button") tag = "button";
    if (node.type === "image") tag = "img";
    if (node.type === "video") tag = "video";

    const propsList = [];
    const props = node.props || {};

    if (tag === "img" && props.src) {
      propsList.push(`src="${props.src}"`);
    }
    if (tag === "img" && props.alt) {
      propsList.push(`alt="${props.alt}"`);
    }
    if (tag === "video" && props.src) {
      propsList.push(`src="${props.src}"`);
      propsList.push(`controls`);
    }

    if (props.className) {
      propsList.push(`className="${props.className}"`);
    }

    // Convert internal computed styles to a style object string
    const styleObj = node.styles || {};
    if (node.type === "hero") {
       styleObj.background = props.background || "var(--token-color-background)";
       styleObj.paddingTop = props.paddingTop ? `${props.paddingTop}px` : "112px";
       styleObj.paddingBottom = props.paddingBottom ? `${props.paddingBottom}px` : "112px";
       styleObj.minHeight = "100vh";
       styleObj.display = "flex";
       styleObj.flexDirection = "column";
       styleObj.alignItems = "center";
       styleObj.justifyContent = "center";
    }

    if (Object.keys(styleObj).length > 0) {
      propsList.push(`style={${objectToStyleString(styleObj)}}`);
    }

    const propsStr = propsList.length > 0 ? " " + propsList.join(" ") : "";

    // Self-closing tags
    if (["img", "input", "br", "hr"].includes(tag)) {
      return `${indent}<${tag}${propsStr} />`;
    }

    const childrenStr = (node.children || [])
      .map((child) => renderNode(child, indentLevel + 2))
      .join("\n");

    const innerContent = tag === "p" || tag === "h1" || tag === "button" 
      ? props.text || childrenStr 
      : childrenStr;

    if (!innerContent) {
      return `${indent}<${tag}${propsStr}></${tag}>`;
    }

    if (tag === "p" || tag === "h1" || tag === "button") {
        return `${indent}<${tag}${propsStr}>${innerContent}</${tag}>`;
    }

    return `${indent}<${tag}${propsStr}>\n${innerContent}\n${indent}</${tag}>`;
  }

  const generatedNodes = components.map((c) => renderNode(c, 6)).join("\n");

  return `import React from 'react';
import './index.css';

export default function App() {
  return (
    <div className="hackforge-app">
${generatedNodes}
    </div>
  );
}
`;
}
