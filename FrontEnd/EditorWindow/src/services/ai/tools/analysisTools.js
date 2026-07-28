import { defineTool, ok, fail } from "./defineTool";
import { resolveNodeRef } from "@/builder/commands/treeHelpers";
import { DEVICES } from "@/builder/responsive/ResponsiveEngine";

const BREAKPOINTS = Object.keys(DEVICES);
const SPACING_GRID = 8;
const TEXT_PROPS = ["text", "title", "label", "content", "heading"];

const finding = (severity, category, message, componentId = null, fix = null) =>
  ({ severity, category, message, componentId, fix });

/** One walk, reused by every analyzer. */
function walkTree(components, visit) {
  const step = (node, depth, parent) => {
    visit(node, depth, parent);
    for (const child of node.children || []) step(child, depth + 1, node);
  };
  for (const node of components || []) step(node, 0, null);
}

function nodeText(node) {
  for (const key of TEXT_PROPS) {
    const value = node.props?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

const rootParam = { type: "string", description: "Limit analysis to this subtree. Omit for the whole page." };

function scopeOf(context, rootId) {
  const components = context.getState().components;
  if (!rootId) return { components };
  const root = resolveNodeRef(components, rootId);
  if (!root) return { error: `No node found with id '${rootId}'.` };
  return { components: [root] };
}

/** Shared shape so the copilot can render any analyzer's result identically. */
const report = (scope, findings, metrics = {}) =>
  ok({
    scope,
    score: Math.max(0, 100 - findings.reduce((n, f) => n + ({ high: 20, medium: 10, low: 4 }[f.severity] || 4), 0)),
    findingCount: findings.length,
    bySeverity: {
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
    },
    findings,
    metrics,
  });

/* ============================================================ */

export function collectLayout(components) {
  const findings = [];
  const metrics = { nodes: 0, maxDepth: 0, offGrid: 0, emptyContainers: 0 };

  walkTree(components, (node, depth) => {
    metrics.nodes++;
    metrics.maxDepth = Math.max(metrics.maxDepth, depth);

    for (const [prop, value] of Object.entries(node.styles || {})) {
      if (!/^(padding|margin|gap)/.test(prop)) continue;
      const pixels = parseInt(value, 10);
      if (!Number.isNaN(pixels) && pixels % SPACING_GRID !== 0) {
        metrics.offGrid++;
        findings.push(finding("low", "spacing", `${prop} of ${value} breaks the ${SPACING_GRID}px grid.`, node.id,
          `Round to ${Math.round(pixels / SPACING_GRID) * SPACING_GRID}px.`));
      }
    }

    const isContainer = ["container", "row", "column", "grid", "card"].includes(node.type);
    if (isContainer && !(node.children || []).length) {
      metrics.emptyContainers++;
      findings.push(finding("medium", "layout", `Empty ${node.type} renders nothing.`, node.id, "Add content or remove it."));
    }
  });

  if (metrics.maxDepth > 8) {
    findings.push(finding("medium", "layout", `Tree is ${metrics.maxDepth} levels deep, which is hard to maintain.`, null, "Flatten with unwrapElement."));
  }
  return { findings, metrics };
}

export const analyzeLayout = defineTool({
  name: "analyzeLayout",
  description: "Checks spacing consistency, empty containers and nesting depth.",
  parameters: { type: "object", properties: { rootId: rootParam } },
  execute: ({ rootId }, context) => {
    const { components, error } = scopeOf(context, rootId);
    if (error) return fail(error);
    const { findings, metrics } = collectLayout(components);
    return report(rootId || "page", findings, metrics);
  },
});

export function collectHierarchy(components) {
  const findings = [];
  const headings = [];

  walkTree(components, (node) => {
    if (node.type !== "heading") return;
    const level = parseInt(String(node.props?.level || "h2").replace("h", ""), 10) || 2;
    headings.push({ id: node.id, level, text: nodeText(node) });
  });

  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length === 0) findings.push(finding("high", "hierarchy", "The page has no H1.", null, "Promote the hero heading to H1."));
  if (h1s.length > 1) {
    findings.push(finding("medium", "hierarchy", `${h1s.length} H1 headings found; a page should have one.`, h1s[1].id, "Demote the extras to H2."));
  }

  for (let i = 1; i < headings.length; i++) {
    const jump = headings[i].level - headings[i - 1].level;
    if (jump > 1) {
      findings.push(finding("low", "hierarchy",
        `Heading level jumps from H${headings[i - 1].level} to H${headings[i].level}.`, headings[i].id,
        `Use H${headings[i - 1].level + 1} instead.`));
    }
  }
  return { findings, metrics: { headingCount: headings.length, h1Count: h1s.length, outline: headings } };
}

export const analyzeHierarchy = defineTool({
  name: "analyzeHierarchy",
  description: "Checks the heading outline: missing or duplicate H1, and skipped heading levels.",
  parameters: { type: "object", properties: { rootId: rootParam } },
  execute: ({ rootId }, context) => {
    const { components, error } = scopeOf(context, rootId);
    if (error) return fail(error);
    const { findings, metrics } = collectHierarchy(components);
    return report(rootId || "page", findings, metrics);
  },
});

/* --- WCAG 2.1 contrast, so the assistant catches blue-on-black itself --- */

function parseColor(value) {
  if (typeof value !== "string") return null;
  const hex = value.trim().replace("#", "");
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return [0, 1, 2].map((i) => parseInt(hex[i] + hex[i], 16));
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  }
  const rgb = value.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
}

/** Relative luminance per WCAG 2.1. */
function luminance(rgb) {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground, background) {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  if (!fg || !bg) return null;
  const [light, dark] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100;
}

/** Large text (>=24px, or >=19px bold) passes at 3:1 instead of 4.5:1. */
const requiredRatio = (node) => {
  const size = parseInt(node.styles?.fontSize, 10) || 16;
  const weight = parseInt(node.styles?.fontWeight, 10) || 400;
  return size >= 24 || (size >= 19 && weight >= 700) ? 3 : 4.5;
};

const TEXT_TYPES = ["heading", "paragraph", "button", "badge", "list"];

export function collectAccessibility(components) {
  const findings = [];
  const metrics = { images: 0, missingAlt: 0, emptyButtons: 0, unlabelledInputs: 0, contrastFailures: 0 };

  // A node's colour usually comes from an ancestor's background.
  const backgrounds = new Map();
  const trackBackground = (nodes, inherited) => {
    for (const node of nodes || []) {
      const own = node.styles?.backgroundColor || node.styles?.background || node.props?.background;
      const current = parseColor(own) ? own : inherited;
      backgrounds.set(node.id, current);
      trackBackground(node.children, current);
    }
  };
  trackBackground(components, "#FFFFFF");

  walkTree(components, (node) => {
    if (TEXT_TYPES.includes(node.type) && node.styles?.color) {
      const background = backgrounds.get(node.id);
      const ratio = contrastRatio(node.styles.color, background);
      const needed = requiredRatio(node);
      if (ratio !== null && ratio < needed) {
        metrics.contrastFailures++;
        findings.push(finding(
          ratio < needed / 2 ? "high" : "medium",
          "accessibility",
          `Text contrast is ${ratio}:1 against ${background} (WCAG needs ${needed}:1).`,
          node.id,
          `Lighten the text or darken the background until it reaches ${needed}:1.`,
        ));
      }
    }
  });

  walkTree(components, (node) => {
    if (node.type === "image") {
      metrics.images++;
      if (!node.props?.alt?.trim()) {
        metrics.missingAlt++;
        findings.push(finding("high", "accessibility", "Image has no alt text.", node.id, "Describe the image in the alt prop."));
      }
    }
    if (node.type === "button" && !nodeText(node)) {
      metrics.emptyButtons++;
      findings.push(finding("high", "accessibility", "Button has no label.", node.id, "Set its text prop."));
    }
    if (["input", "textarea"].includes(node.type) && !node.props?.label?.trim() && !node.props?.placeholder?.trim()) {
      metrics.unlabelledInputs++;
      findings.push(finding("medium", "accessibility", `${node.type} has neither label nor placeholder.`, node.id, "Add a label prop."));
    }
    const size = parseInt(node.styles?.fontSize, 10);
    if (!Number.isNaN(size) && size < 12) {
      findings.push(finding("medium", "accessibility", `Font size ${size}px is below the 12px readability floor.`, node.id, "Raise to at least 14px."));
    }
  });

  return { findings, metrics };
}

export const analyzeAccessibility = defineTool({
  name: "analyzeAccessibility",
  description: "Checks alt text, button labels, form labelling and minimum font sizes.",
  parameters: { type: "object", properties: { rootId: rootParam } },
  execute: ({ rootId }, context) => {
    const { components, error } = scopeOf(context, rootId);
    if (error) return fail(error);
    const { findings, metrics } = collectAccessibility(components);
    return report(rootId || "page", findings, metrics);
  },
});

export function collectSeo(components) {
  const findings = [];
  const metrics = { words: 0, links: 0, images: 0, missingAlt: 0 };

  walkTree(components, (node) => {
    const text = nodeText(node);
    if (text) metrics.words += text.split(/\s+/).length;
    if (node.type === "image") {
      metrics.images++;
      if (!node.props?.alt?.trim()) metrics.missingAlt++;
    }
    if (node.props?.href || node.props?.link) metrics.links++;
  });

  const { metrics: headingMetrics } = collectHierarchy(components);
  if (headingMetrics.h1Count === 0) findings.push(finding("high", "seo", "No H1: search engines have no page title signal.", null, "Add an H1 heading."));
  if (metrics.words < 100) findings.push(finding("medium", "seo", `Only ${metrics.words} words of copy; thin content ranks poorly.`, null, "Expand the body copy."));
  if (metrics.missingAlt > 0) findings.push(finding("medium", "seo", `${metrics.missingAlt} images without alt text lose image-search traffic.`, null, "Add alt text."));
  if (metrics.links === 0) findings.push(finding("low", "seo", "No links found on the page.", null, "Add navigation or CTA links."));

  return { findings, metrics: { ...metrics, ...headingMetrics } };
}

export const analyzeSEO = defineTool({
  name: "analyzeSEO",
  description: "Checks H1 presence, content depth, alt text coverage and linking.",
  parameters: { type: "object", properties: { rootId: rootParam } },
  execute: ({ rootId }, context) => {
    const { components, error } = scopeOf(context, rootId);
    if (error) return fail(error);
    const { findings, metrics } = collectSeo(components);
    return report(rootId || "page", findings, metrics);
  },
});

export function collectPerformance(components) {
  const findings = [];
  const metrics = { nodes: 0, images: 0, videos: 0, remoteAssets: 0, heavyShadows: 0, blurs: 0 };

  walkTree(components, (node) => {
    metrics.nodes++;
    if (node.type === "image") metrics.images++;
    if (node.type === "video") metrics.videos++;

    const src = node.props?.src;
    if (typeof src === "string" && /^https?:/.test(src)) metrics.remoteAssets++;
    if (typeof src === "string" && src.startsWith("blob:")) {
      findings.push(finding("high", "performance", "Asset uses a blob: URL, which breaks after a reload.", node.id, "Upload the asset to a durable URL."));
    }
    if (node.styles?.filter?.includes("blur")) metrics.blurs++;
    if (node.styles?.backdropFilter) metrics.blurs++;
    if (node.styles?.boxShadow && node.styles.boxShadow.split(",").length > 2) metrics.heavyShadows++;
  });

  if (metrics.nodes > 300) findings.push(finding("medium", "performance", `${metrics.nodes} nodes on one page slows rendering.`, null, "Split into more pages."));
  if (metrics.blurs > 6) findings.push(finding("medium", "performance", `${metrics.blurs} blur effects are expensive to composite.`, null, "Reduce blur usage."));
  if (metrics.videos > 2) findings.push(finding("low", "performance", `${metrics.videos} videos will dominate page weight.`, null, "Lazy-load or use posters."));

  return { findings, metrics };
}

export const analyzePerformance = defineTool({
  name: "analyzePerformance",
  description: "Estimates render cost: node count, expensive effects, media weight and non-durable asset URLs.",
  parameters: { type: "object", properties: { rootId: rootParam } },
  execute: ({ rootId }, context) => {
    const { components, error } = scopeOf(context, rootId);
    if (error) return fail(error);
    const { findings, metrics } = collectPerformance(components);
    return report(rootId || "page", findings, metrics);
  },
});

export function collectResponsiveness(components) {
  const findings = [];
  const metrics = { nodes: 0, withOverrides: 0, fixedWidths: 0 };

  walkTree(components, (node) => {
    metrics.nodes++;
    const responsive = node.responsive || {};
    const tuned = BREAKPOINTS.filter((bp) => Object.keys(responsive[bp] || {}).length);
    if (tuned.length) metrics.withOverrides++;

    const width = node.styles?.width;
    if (typeof width === "string" && width.endsWith("px") && parseInt(width, 10) > 600) {
      metrics.fixedWidths++;
      findings.push(finding("high", "responsive", `Fixed width ${width} will overflow on mobile.`, node.id, "Use a percentage or max-width."));
    }

    const size = parseInt(node.styles?.fontSize, 10);
    if (!Number.isNaN(size) && size >= 48 && !responsive.mobile?.fontSize) {
      findings.push(finding("medium", "responsive", `${size}px text has no mobile override.`, node.id,
        `setResponsiveStyle at mobile with about ${Math.round(size * 0.55)}px.`));
    }
  });

  if (metrics.nodes && metrics.withOverrides === 0) {
    findings.push(finding("medium", "responsive", "No component defines breakpoint overrides.", null, "Tune the mobile breakpoint."));
  }
  return { findings, metrics };
}

export const analyzeResponsiveness = defineTool({
  name: "analyzeResponsiveness",
  description: "Finds fixed widths, oversized text without mobile overrides, and untuned breakpoints.",
  parameters: { type: "object", properties: { rootId: rootParam } },
  execute: ({ rootId }, context) => {
    const { components, error } = scopeOf(context, rootId);
    if (error) return fail(error);
    const { findings, metrics } = collectResponsiveness(components);
    return report(rootId || "page", findings, metrics);
  },
});

/** Every analyzer at once -- the one call worth making before a redesign. */
export function runFullAudit(components) {
  const parts = {
    layout: collectLayout(components),
    hierarchy: collectHierarchy(components),
    accessibility: collectAccessibility(components),
    seo: collectSeo(components),
    performance: collectPerformance(components),
    responsive: collectResponsiveness(components),
  };
  const findings = Object.values(parts).flatMap((part) => part.findings);
  const metrics = Object.fromEntries(Object.entries(parts).map(([key, part]) => [key, part.metrics]));
  return { findings, metrics };
}

export const auditProject = defineTool({
  name: "auditProject",
  description: "Runs every analyzer (layout, hierarchy, accessibility, SEO, performance, responsiveness) and returns one ranked list of findings.",
  parameters: {
    type: "object",
    properties: {
      rootId: rootParam,
      minSeverity: { type: "string", enum: ["low", "medium", "high"], description: "Only return findings at or above this severity." },
    },
  },
  execute: ({ rootId, minSeverity = "low" }, context) => {
    const { components, error } = scopeOf(context, rootId);
    if (error) return fail(error);

    const rank = { low: 0, medium: 1, high: 2 };
    const { findings, metrics } = runFullAudit(components);
    const filtered = findings
      .filter((f) => rank[f.severity] >= (rank[minSeverity] ?? 0))
      .sort((a, b) => rank[b.severity] - rank[a.severity]);

    return report(rootId || "page", filtered, metrics);
  },
});

export const analysisTools = [
  analyzeLayout, analyzeHierarchy, analyzeAccessibility, analyzeSEO,
  analyzePerformance, analyzeResponsiveness, auditProject,
];
