// Run: node --import ./alias-loader.mjs src/services/ai/tools/analysisTools.test.mjs
import assert from "node:assert/strict";
import {
  collectLayout, collectHierarchy, collectAccessibility,
  collectSeo, collectPerformance, collectResponsiveness, runFullAudit,
} from "./analysisTools.js";

const page = [
  {
    id: "hero", type: "hero", styles: { paddingTop: "100px" }, children: [
      { id: "h1", type: "heading", props: { level: "h1", text: "Build Exceptional Hackathons" }, styles: { fontSize: "72px" }, responsive: {} },
      { id: "p1", type: "paragraph", props: { text: "Launch branded hackathons and celebrate innovation with your community today." }, styles: { fontSize: "10px" } },
      { id: "img1", type: "image", props: { src: "blob:http://x/1" } },
      { id: "btn1", type: "button", props: { text: "" } },
      { id: "empty", type: "container", children: [] },
    ],
  },
  { id: "sec2", type: "about", children: [{ id: "h4", type: "heading", props: { level: "h4", text: "Details" } }] },
];

const has = (findings, needle) => findings.some((f) => f.message.includes(needle));

// --- layout: off-grid spacing and dead containers ---
const layout = collectLayout(page);
assert.equal(layout.metrics.offGrid, 1, "100px padding is not a multiple of 8");
assert.ok(has(layout.findings, "breaks the 8px grid"));
assert.equal(layout.metrics.emptyContainers, 1);
assert.ok(layout.findings.find((f) => f.componentId === "empty").fix.includes("Add content"));

// --- hierarchy: H1 present, but H1 -> H4 skips levels ---
const hierarchy = collectHierarchy(page);
assert.equal(hierarchy.metrics.h1Count, 1);
assert.ok(has(hierarchy.findings, "jumps from H1 to H4"));
assert.equal(collectHierarchy([]).metrics.h1Count, 0);
assert.ok(has(collectHierarchy([]).findings, "no H1"), "an empty page must flag the missing H1");

// --- accessibility: alt text, button label, tiny type ---
const a11y = collectAccessibility(page);
assert.equal(a11y.metrics.missingAlt, 1);
assert.equal(a11y.metrics.emptyButtons, 1);
assert.ok(has(a11y.findings, "readability floor"), "10px text is below the floor");
assert.ok(a11y.findings.every((f) => ["high", "medium", "low"].includes(f.severity)));

// --- seo: thin copy is counted, not guessed ---
const seo = collectSeo(page);
assert.ok(seo.metrics.words > 0 && seo.metrics.words < 100);
assert.ok(has(seo.findings, "words of copy"));

// --- performance: blob URLs never survive a reload ---
const perf = collectPerformance(page);
assert.ok(has(perf.findings, "blob:"));
assert.equal(perf.findings.find((f) => f.message.includes("blob:")).severity, "high");

// --- responsive: big type with no mobile override ---
const responsive = collectResponsiveness(page);
assert.ok(has(responsive.findings, "no mobile override"));
assert.ok(responsive.findings.find((f) => f.componentId === "h1").fix.includes("setResponsiveStyle"));

// --- full audit aggregates every analyzer, no double counting of categories ---
const full = runFullAudit(page);
const total = [layout, hierarchy, a11y, seo, perf, responsive].reduce((n, part) => n + part.findings.length, 0);
assert.equal(full.findings.length, total, "auditProject must report every analyzer's findings");
assert.deepEqual(Object.keys(full.metrics).sort(), ["accessibility", "hierarchy", "layout", "performance", "responsive", "seo"]);

// --- a clean page produces nothing ---
const clean = runFullAudit([
  { id: "s", type: "hero", styles: { paddingTop: "96px" }, children: [
    { id: "hh", type: "heading", props: { level: "h1", text: "Title" }, styles: { fontSize: "32px" } },
  ] },
]);
assert.equal(clean.findings.filter((f) => f.severity === "high").length, 0, "no high-severity noise on a tidy page");

console.log("analysisTools: all checks passed");

/* --- contrast: the blue-on-black case the assistant could not previously see --- */
import { contrastRatio } from "./analysisTools.js";

assert.equal(contrastRatio("#FFFFFF", "#000000"), 21, "max ratio");
assert.equal(contrastRatio("#000000", "#000000"), 1, "identical colours");
// #2563eb on black is 4.1:1 -- below the 4.5:1 body-text bar, above the 3:1
// large-text bar. The size rule decides, which is why it is applied per node.
assert.ok(contrastRatio("#2563eb", "#000000") < 4.5 && contrastRatio("#2563eb", "#000000") > 3);
assert.ok(contrastRatio("#FFFFFF", "#2B0A5A") > 4.5, "white on brand purple passes");
assert.equal(contrastRatio("#fff", "#000"), 21, "3-digit hex");
assert.equal(contrastRatio("rgb(255,255,255)", "rgb(0,0,0)"), 21, "rgb() notation");
assert.equal(contrastRatio("not-a-colour", "#000"), null, "unparseable input is reported, not guessed");

// body-size blue on a black section: 4.1:1 against a 4.5:1 requirement
const darkSection = [{
  id: "s", type: "blank", props: { background: "#000000" }, styles: {}, children: [
    { id: "h", type: "paragraph", props: { text: "Problem statement 1" }, styles: { color: "#2563eb", fontSize: "16px" }, children: [] },
  ],
}];
const contrast = collectAccessibility(darkSection);
assert.equal(contrast.metrics.contrastFailures, 1, "must flag low-contrast body text");
assert.ok(contrast.findings.some((f) => f.message.includes("contrast")));
assert.ok(contrast.findings.find((f) => f.componentId === "h").fix.includes("Lighten"));

// the same colour as a 48px heading is acceptable, and must not be flagged
const bigBlue = [{
  id: "s0", type: "blank", props: { background: "#000000" }, styles: {}, children: [
    { id: "bh", type: "heading", props: { text: "Problem Statement" }, styles: { color: "#2563eb", fontSize: "48px" }, children: [] },
  ],
}];
assert.equal(collectAccessibility(bigBlue).metrics.contrastFailures, 0, "large text passes at 3:1");

// background is inherited from the ancestor section, not assumed white
const lightSection = [{
  id: "s2", type: "blank", props: { background: "#FFFFFF" }, styles: {}, children: [
    { id: "h2", type: "heading", props: { text: "Fine" }, styles: { color: "#111111", fontSize: "48px" }, children: [] },
  ],
}];
assert.equal(collectAccessibility(lightSection).metrics.contrastFailures, 0, "dark on white must pass");

// large text is held to 3:1, not 4.5:1
const large = [{ id: "s3", type: "blank", props: { background: "#FFFFFF" }, styles: {}, children: [
  { id: "big", type: "heading", props: { text: "Big" }, styles: { color: "#767676", fontSize: "48px" }, children: [] },
] }];
assert.equal(collectAccessibility(large).metrics.contrastFailures, 0, "WCAG relaxes to 3:1 for large text");

console.log("contrast: all checks passed");
