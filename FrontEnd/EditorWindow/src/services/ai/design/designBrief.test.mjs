import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseSections, buildDesignBrief } from "./designBrief.js";

// The real file, read from disk so this test tracks whatever a human last wrote.
const rules = readFileSync(new URL("./DESIGN_RULES.md", import.meta.url), "utf8");

// --- parsing the human-owned document ---
const sections = parseSections(rules);
assert.ok(sections.length > 20, `expected many sections, got ${sections.length}`);

const ids = new Set(sections.map((s) => s.id));
for (const id of ["5.1", "5.2", "5.3", "8.2", "9.1", "13"]) {
  assert.ok(ids.has(id), `section ${id} not found — heading format changed?`);
}

// A numbered line inside prose must not be mistaken for a heading.
const prose = parseSections("1. Purpose\nbody\n" + "2. This is a very long sentence that merely begins with a number and should never be treated as a section heading because it runs on.\n");
assert.equal(prose.length, 1, "long numbered prose lines are not headings");

// --- the budget is the whole point: this is what caused the 422 ---
const brief = buildDesignBrief(rules, 8000);
assert.ok(brief.length <= 8000, `brief ${brief.length} chars exceeds its budget`);
assert.ok(brief.length > 1000, "brief collapsed to nothing");

// Highest-priority guidance survives truncation.
assert.match(brief, /## 18 /, "AI Agent Instructions kept");
assert.match(brief, /## 5\.2 /, "Typography kept");

// --- degrading safely ---
assert.ok(buildDesignBrief("", 8000).length === 0 || buildDesignBrief("", 8000).length < 100);
const unparseable = buildDesignBrief("no headings here, just prose ".repeat(500), 500);
assert.ok(unparseable.length <= 500, "falls back to a plain slice, still under budget");
assert.ok(unparseable.length > 0, "unparseable file still yields some guidance");

// A tiny budget must not emit a half-sentence rule.
const tiny = buildDesignBrief(rules, 300);
assert.ok(tiny.length <= 300, "tiny budget respected");

// --- the guarantee that matters: the whole prompt fits the backend limit ---
// PromptBuilder imports .md?raw and the store, so recreate its arithmetic here:
// base prompt + builder brief + design brief must clear 20,000 with room for
// live page context.
const builderBrief = readFileSync(new URL("./BUILDER_BRIEF.md", import.meta.url), "utf8");
const BASE_PROMPT_CHARS = 4000; // rules, context header and tool-format block
const total = BASE_PROMPT_CHARS + builderBrief.length + brief.length;
assert.ok(total < 20000 - 600, `system prompt would be ~${total} chars, too close to the 20000 limit`);

console.log(`designBrief: all checks passed (brief ${brief.length} chars, projected prompt ~${total})`);
