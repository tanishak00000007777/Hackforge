import { resolveTag, listItems, escapeHtml } from "./elementTags";
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

  // The store keeps tokens under tokens[mode] (see builder/styles/theme.js) and
  // ThemeInjector emits --token-<group>-<key> from that tree. Export must read
  // the same shape, or every generated variable comes out empty.
  const mode = globalTheme.mode || "light";
  const tokens = globalTheme.tokens?.[mode] || globalTheme.tokens?.light || {};

  const rootVars = [];
  const walkTokens = (obj, prefix = "") => {
    for (const [key, value] of Object.entries(obj || {})) {
      if (value && typeof value === "object") walkTokens(value, `${prefix}${key}-`);
      else rootVars.push(`  --token-${prefix}${key}: ${value};`);
    }
  };
  walkTokens(tokens);

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


/* ============================================================
   MARKUP GENERATION
   Both generators walk the tree through the same ELEMENT_TAGS
   table, so every registered type exports correctly instead of
   collapsing into an empty <div>.
============================================================ */

function styleEntries(node) {
  const styles = { ...(node.styles || {}) };

  // Section props carry layout that never made it into `styles`.
  if (node.props?.background) styles.background = node.props.background;
  if (node.props?.paddingTop !== undefined) styles.paddingTop = `${node.props.paddingTop}px`;
  if (node.props?.paddingBottom !== undefined) styles.paddingBottom = `${node.props.paddingBottom}px`;

  return Object.entries(styles).filter(([, value]) => value !== undefined && value !== null && value !== "");
}

function attrPairs(node, spec) {
  const props = node.props || {};
  const pairs = [];
  for (const attr of spec.attrs || []) {
    if (props[attr] !== undefined && props[attr] !== null && props[attr] !== "") pairs.push([attr, props[attr]]);
  }
  return pairs;
}

const classesFor = (node, spec) => node.props?.className || spec.className || "";

export function generateJSX(components) {
  function renderNode(node, indentLevel) {
    if (node.hidden) return "";

    const indent = " ".repeat(indentLevel);
    const spec = resolveTag(node);
    const parts = [];

    const className = classesFor(node, spec);
    if (className) parts.push(`className="${className}"`);
    for (const [attr, value] of attrPairs(node, spec)) {
      parts.push(typeof value === "boolean" ? (value ? attr : "") : `${attr}="${value}"`);
    }

    const styles = styleEntries(node);
    if (styles.length) {
      const body = styles.map(([key, value]) => `${indent}    ${key}: '${value}'`).join(",\n");
      parts.push(`style={{\n${body}\n${indent}  }}`);
    }

    const attrs = parts.filter(Boolean).length ? " " + parts.filter(Boolean).join(" ") : "";
    if (spec.void) return `${indent}<${spec.tag}${attrs} />`;

    if (spec.items) {
      const items = listItems(node.props?.[spec.items]);
      if (items.length) {
        const rows = items.map((item) => `${indent}  <li>{${JSON.stringify(item)}}</li>`).join("\n");
        return `${indent}<${spec.tag}${attrs}>\n${rows}\n${indent}</${spec.tag}>`;
      }
    }

    const text = spec.text ? node.props?.[spec.text] : null;
    const children = (node.children || []).map((child) => renderNode(child, indentLevel + 2)).filter(Boolean).join("\n");

    if (text && !children) return `${indent}<${spec.tag}${attrs}>{${JSON.stringify(text)}}</${spec.tag}>`;
    if (!text && !children) return `${indent}<${spec.tag}${attrs}></${spec.tag}>`;

    const inner = [text ? `${indent}  {${JSON.stringify(text)}}` : "", children].filter(Boolean).join("\n");
    return `${indent}<${spec.tag}${attrs}>\n${inner}\n${indent}</${spec.tag}>`;
  }

  const generatedNodes = (components || []).map((node) => renderNode(node, 6)).filter(Boolean).join("\n");

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

const camelToKebabProp = (key) => key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/**
 * Static HTML for the same tree. Needed for a real "publish", and it is the
 * format the PersonaForge AI editing backend consumes.
 */
export function generateHTML(components, globalTheme, { title = "HackForge Site", nav = null, currentHref = null } = {}) {
  function renderNode(node, indentLevel) {
    if (node.hidden) return "";

    const indent = " ".repeat(indentLevel);
    const spec = resolveTag(node);
    const parts = [];

    const className = classesFor(node, spec);
    if (className) parts.push(`class="${escapeHtml(className)}"`);
    if (node.id) parts.push(`data-node-id="${escapeHtml(node.id)}"`);
    for (const [attr, value] of attrPairs(node, spec)) {
      if (typeof value === "boolean") { if (value) parts.push(attr); }
      else parts.push(`${attr}="${escapeHtml(value)}"`);
    }

    const styles = styleEntries(node);
    if (styles.length) {
      parts.push(`style="${escapeHtml(styles.map(([k, v]) => `${camelToKebabProp(k)}: ${v}`).join("; "))}"`);
    }

    const attrs = parts.length ? " " + parts.join(" ") : "";
    if (spec.void) return `${indent}<${spec.tag}${attrs}>`;

    if (spec.items) {
      const items = listItems(node.props?.[spec.items]);
      if (items.length) {
        const rows = items.map((item) => `${indent}  <li>${escapeHtml(item)}</li>`).join("\n");
        return `${indent}<${spec.tag}${attrs}>\n${rows}\n${indent}</${spec.tag}>`;
      }
    }

    const text = spec.text ? node.props?.[spec.text] : null;
    const children = (node.children || []).map((child) => renderNode(child, indentLevel + 2)).filter(Boolean).join("\n");

    if (text && !children) return `${indent}<${spec.tag}${attrs}>${escapeHtml(text)}</${spec.tag}>`;
    if (!text && !children) return `${indent}<${spec.tag}${attrs}></${spec.tag}>`;

    const inner = [text ? `${indent}  ${escapeHtml(text)}` : "", children].filter(Boolean).join("\n");
    return `${indent}<${spec.tag}${attrs}>\n${inner}\n${indent}</${spec.tag}>`;
  }

  const body = (components || []).map((node) => renderNode(node, 4)).filter(Boolean).join("\n");

  const navMarkup = nav?.length
    ? `    <nav class="site-nav">\n` +
      nav
        .map(
          (link) =>
            `      <a href="${escapeHtml(link.href)}"${link.href === currentHref ? ' aria-current="page"' : ""}>${escapeHtml(link.label)}</a>`,
        )
        .join("\n") +
      `\n    </nav>\n`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
${navMarkup}${body}
  </body>
</html>
`;
}
