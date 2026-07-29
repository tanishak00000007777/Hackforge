import assert from "node:assert/strict";
import { ContextEngine } from "./ContextEngine.js";

const engine = new ContextEngine();

// --- composition: the page-level summary a no-selection request relies on ---
assert.match(engine.composition([]), /EMPTY PAGE/, "empty page is called out");

const page = [
  { id: "a", type: "hero" },
  { id: "b", type: "tracks" },
  { id: "c", type: "tracks" },
];
const summary = engine.composition(page);
assert.match(summary, /hero -> tracks x2/, "order kept and repeats counted");
assert.match(summary, /NOT ON THE PAGE YET:.*footer/, "missing sections surfaced");
assert.ok(!/NOT ON THE PAGE YET:.*hero/.test(summary), "present sections are not listed as missing");

const complete = ["hero", "about", "tracks", "timeline", "sponsors", "faq", "footer"]
  .map((type, i) => ({ id: String(i), type }));
assert.match(engine.composition(complete), /All common sections are present/);

// --- themeString: styling is only as good as the tokens handed to the model ---
const theme = {
  mode: "dark",
  tokens: { dark: { color: { primary: "#8F75FF" }, typography: { fontFamily: "Inter" }, radius: { button: "12px" } } },
};
const themeText = engine.themeString(theme);
assert.match(themeText, /MODE: dark/);
assert.match(themeText, /primary=#8F75FF/, "real token values reach the prompt");
assert.match(themeText, /button 12px/);

// Missing/!partial theme must not throw -- a fresh project has no tokens yet.
assert.match(engine.themeString({}), /MODE: light/, "defaults to light");
assert.match(engine.themeString({}), /none/, "empty colours degrade gracefully");
assert.doesNotThrow(() => engine.themeString());

console.log("ContextEngine: all checks passed");
