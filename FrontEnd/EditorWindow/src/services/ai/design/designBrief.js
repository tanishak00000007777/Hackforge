import designRules from "./DESIGN_RULES.md?raw";

/**
 * DESIGN_RULES.md is the human source of truth for the whole product — app
 * shell, billing, emails, toasts, the lot. At ~39k characters it cannot be
 * pasted into a prompt: the backend caps `system` at 20,000 characters and
 * rejects the request with a 422 before any model runs. That was the
 * "Something went wrong" error.
 *
 * So the file stays canonical and un-truncated for humans, and this module
 * lifts out only the parts a section builder can act on, under a hard budget.
 * Editing the .md never breaks the request again; at worst a low-priority
 * section drops off the end.
 */

/** Headings look like "5.2 Typography" or "13 Accessibility" (no leading #). */
const HEADING = /^(\d+(?:\.\d+)?)[.)]?\s+([A-Z].*)$/;

/**
 * Which sections matter when composing a page section, most valuable first.
 * The budget is spent in this order, so what survives truncation is what the
 * model most needs: how to write it, then what it must look like.
 */
const PRIORITY = [
  "18",   // AI Agent Instructions
  "17",   // Prohibited Patterns
  "5.2",  // Typography
  "5.1",  // Colour system
  "5.3",  // Spacing
  "8.2",  // Hero
  "8.3",  // Feature sections
  "9.1",  // Buttons
  "4",    // Visual Direction
  "13",   // Accessibility
  "5.5",  // Radius
  "5.7",  // Shadows
  "9.4",  // Cards
  "14",   // Content Design
  "12",   // Responsive Design Rules
  "8.6",  // Final CTA
  "8.4",  // Social proof
  "5.4",  // Layout grid and breakpoints
];

/** Split the document into { id, title, body } blocks, keyed by heading number. */
export function parseSections(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  const sections = [];
  let current = null;

  for (const line of lines) {
    const match = HEADING.exec(line.trim());
    // A numbered heading only starts a section when it is short; a sentence
    // that happens to begin with "1. " inside prose must not split the doc.
    if (match && line.trim().length < 80) {
      current = { id: match[1], title: match[2].trim(), lines: [] };
      sections.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }

  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    body: section.lines.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
  }));
}

/**
 * The slice of the design system to put in front of the model.
 * `budget` is characters, not tokens — the backend limit is measured that way.
 */
export function buildDesignBrief(markdown = designRules, budget = 8000) {
  const sections = parseSections(markdown);
  const byId = new Map(sections.map((section) => [section.id, section]));

  const chosen = [];
  let used = 0;

  for (const id of PRIORITY) {
    const section = byId.get(id);
    if (!section || !section.body) continue;

    const block = `## ${section.id} ${section.title}\n${section.body}`;
    if (used + block.length > budget) continue; // skip, don't cut mid-rule
    chosen.push(block);
    used += block.length;
  }

  if (!chosen.length) {
    // An unparseable or rewritten file must not silently remove all guidance.
    return String(markdown).slice(0, budget);
  }

  return chosen.join("\n\n");
}

export const designBrief = buildDesignBrief();
