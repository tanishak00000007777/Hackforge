import { toolRegistry } from "./ToolRegistry";

/**
 * Sending all 82 tool schemas costs ~8k tokens per request, which alone
 * exceeds a free-tier per-minute budget. So each turn gets a small relevant
 * subset instead: a fixed core, plus whichever tools score against the user's
 * words. Anything left out is still reachable through discoverTools/callTool,
 * so narrowing the list never removes a capability.
 */

/**
 * Always present: orientation, batching and escape hatches, plus the styling
 * tools the design rules require after every create. Keyword scoring alone
 * never surfaces those -- "add a hero section" contains no word that matches
 * updateSpacing or updateColors -- so a created section stayed unstyled.
 */
export const CORE_TOOL_NAMES = [
  "getCanvasState",
  "getSelection",
  "findComponent",
  "inspectComponent",
  "setContent",
  "discoverTools",
  "callTool",
  "executeBatchActions",
  "composeSection",
  "updateColors",
  "updateTypography",
  "updateSpacing",
];
// moveElement is deliberately NOT core: "move" matches its name at full weight,
// so scoring surfaces it whenever it is actually wanted.

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "with", "this",
  "that", "it", "is", "are", "be", "make", "please", "can", "you", "my", "me",
  "i", "we", "should", "would", "how", "what", "do", "does", "get", "set", "up",
]);

const WHOLE_SITE_SCOPE = /\b(theme|palette|site[- ]?wide|whole (?:site|page)|entire (?:site|page)|all sections|every section|global)\b/i;
const WHOLE_SITE_COLOR_TOOLS = new Set(["applyTheme", "updateThemeToken", "generateTheme"]);

/**
 * Page management is gated behind explicit intent.
 *
 * The canvas IS a page, so ordinary edit requests say the word constantly --
 * "make this page look better", "add a hero to the page". Every one of these
 * tools carries "page" in its NAME, which scores at the top weight, so they
 * outranked the tools that do the actual edit. The model then took the highest
 * ranked option and created or switched pages instead of editing: the canvas
 * went blank, the page switcher in the header changed, and because switching
 * pages clears the undo stack there was nothing to undo.
 *
 * They stay reachable through discoverTools/callTool, so a real request for a
 * second page still works.
 */
const PAGE_TOOL_NAMES = new Set([
  "createPage", "switchPage", "deletePage", "renamePage", "duplicatePage", "listPages",
]);

/** Verbs that only ever mean a NEW page ("create this page" is not a request). */
const PAGE_CREATE_VERBS = new Set(["create", "add", "make"]);

/** Verbs that act on a whole page, and still do so with "this" ("rename this page"). */
const PAGE_MANAGE_VERBS = new Set([
  "rename", "delete", "remove", "duplicate", "copy", "switch", "navigate", "go", "open", "list",
]);

/** Function words that can sit between the verb and "page" without changing it. */
const PAGE_FILLERS = new Set([
  "a", "an", "the", "to", "on", "into", "my", "our", "new", "another", "second",
  "third", "next", "previous", "last", "first", "blank", "empty", "called", "named",
]);

/** "this page" is the canvas the user is already looking at. */
const PAGE_DEMONSTRATIVES = new Set(["this", "that", "current", "same", "whole", "entire"]);

/** Words that can follow "page" in a real request about pages. */
const PAGE_TRAILERS = new Set([
  "and", "or", "then", "please", "now", "instead", "here", "too", "also", "for", "from", "with", "as", "it",
]);

export function wantsPageTools(prompt) {
  const tokens = String(prompt || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

  for (let i = 0; i < tokens.length; i++) {
    // Plural is only used when talking about more than one of them.
    if (tokens[i] === "pages") return true;
    if (tokens[i] !== "page") continue;

    // "page title", "page header": here "page" modifies the next noun and the
    // request is about that noun, not about pages.
    const next = tokens[i + 1];
    if (next && !PAGE_FILLERS.has(next) && !PAGE_TRAILERS.has(next)) continue;

    // Walk back to the verb. A second content word on the way means the verb
    // was aimed at something else: in "delete the hero on this page" the verb
    // belongs to the hero, not the page.
    let contentWords = 0;
    let demonstrative = false;

    for (let back = 1; back <= 4 && i - back >= 0; back++) {
      const word = tokens[i - back];

      if (PAGE_MANAGE_VERBS.has(word)) {
        if (contentWords === 0 || !demonstrative) return true;
        break;
      }
      // "make this page look better" is an edit request, not a new page.
      if (PAGE_CREATE_VERBS.has(word)) {
        if (!demonstrative) return true;
        break;
      }
      if (PAGE_DEMONSTRATIVES.has(word)) { demonstrative = true; continue; }
      if (PAGE_FILLERS.has(word)) continue;
      if (++contentWords > 1) break;
    }
  }
  return false;
}

/** "toggleSectionVisibility" -> ["toggle","section","visibility"] */
const splitName = (name) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ").toLowerCase().split(/\s+/);

/**
 * Split on separators AND camelCase, before lowercasing. A model that invents
 * "changeFontFamily" must still find updateTypography -- lowercasing first
 * collapses it to one meaningless token that matches nothing.
 */
const words = (text) =>
  String(text || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

/** Cheap stem so "colours"/"color" and "sections"/"section" match. */
const stem = (word) => word.replace(/(ours|our)$/, "or").replace(/(ies)$/, "y").replace(/(es|s)$/, "");

/** Params every tool has; they carry no signal about which tool is meant. */
const GENERIC_PARAMS = new Set(["component", "apply", "limit", "query", "args", "name", "index", "root"]);

/**
 * Verbs shared by many tool names. Matching one says almost nothing about
 * which tool is meant -- "change" appears in changeElementType, changeTone and
 * any invented name like changeFontFamily -- so they score far below the noun
 * that identifies the actual target.
 */
const WEAK_NAME_WORDS = new Set([
  "get", "set", "update", "change", "make", "apply", "run", "toggle", "add",
  "creat", "delet", "remov", "replac", "modify", "edit", "tool", "action",
]);

function indexTool(tool) {
  const nameWords = splitName(tool.name).map(stem);
  const properties = tool.parameters?.properties || {};

  // Enum values carry the domain vocabulary: "heading", "list", "blank" live
  // only in createElement/createSection's `type` enum, so without these a
  // request to "add a heading" never reaches the tool that can make one.
  const enumWords = Object.values(properties).flatMap((spec) =>
    (spec?.enum || []).flatMap((value) => words(value).map(stem)),
  );

  // Parameter names are what a model reaches for when it invents a tool name
  // ("changeFontFamily" -> fontFamily), so they score close to name matches.
  const paramWords = [...Object.keys(properties).flatMap((key) => words(key).map(stem)), ...enumWords]
    .filter((word) => !GENERIC_PARAMS.has(word));

  return {
    tool,
    nameWords: new Set(nameWords),
    paramWords: new Set(paramWords),
    descWords: new Set(words(tool.description).map(stem)),
  };
}

let index = null;
let indexedCount = 0;

function getIndex() {
  const all = toolRegistry.getAllTools();
  if (!index || indexedCount !== all.length) {
    index = all.map(indexTool);
    indexedCount = all.length;
  }
  return index;
}

/**
 * A tool's relevance to the prompt. What the user wants to change (the noun,
 * often a parameter name) identifies the tool far better than the verb: a
 * request to "change the font family" must reach updateTypography, not
 * changeElementType just because both say "change".
 */
export function scoreTool(entry, promptWords) {
  let score = 0;
  for (const word of promptWords) {
    if (entry.nameWords.has(word)) score += WEAK_NAME_WORDS.has(word) ? 3 : 10;
    else if (entry.paramWords.has(word)) score += 8;
    else if (entry.descWords.has(word)) score += 2;
    else if ([...entry.nameWords].some((part) => part.startsWith(word) || word.startsWith(part))) score += 4;
  }
  return score;
}

/**
 * Tools to expose for one turn: the core set, plus the highest scoring others.
 * `maxTools` is a token budget in disguise -- each schema costs ~100 tokens.
 * It has to clear CORE_TOOL_NAMES by a wide margin: the core is subtracted from
 * this budget, so a cap set too close to the core size starves the scored list
 * and drops the very tool the prompt asked for.
 */
export function selectTools(prompt, { maxTools = 20, hasSelection = false } = {}) {
  const entries = getIndex();
  const core = entries.filter((entry) => CORE_TOOL_NAMES.includes(entry.tool.name)).map((entry) => entry.tool);
  const selectedNodeIsTarget = hasSelection && !WHOLE_SITE_SCOPE.test(prompt);
  const pageManagement = wantsPageTools(prompt);

  const promptWords = [...new Set(words(prompt).map(stem))];
  if (!promptWords.length) return core;

  const ranked = entries
    .filter((entry) => !CORE_TOOL_NAMES.includes(entry.tool.name))
    .filter((entry) => !selectedNodeIsTarget || !WHOLE_SITE_COLOR_TOOLS.has(entry.tool.name))
    .filter((entry) => pageManagement || !PAGE_TOOL_NAMES.has(entry.tool.name))
    .map((entry) => ({ tool: entry.tool, score: scoreTool(entry, promptWords) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, maxTools - core.length))
    .map((entry) => entry.tool);

  return [...core, ...ranked];
}

/**
 * Ranked tools for a free-text description, with their schemas so the caller
 * can invoke one immediately. `extraTerms` lets a failed call feed its own
 * argument names in ("fontFamily"), which is usually the strongest clue about
 * which tool was really meant.
 */
export function searchToolIndex(query, limit = 12, extraTerms = []) {
  // Argument names are a strong signal, except the generic ones every tool
  // shares: "componentId" would otherwise match findComponent by name.
  const argWords = extraTerms.flatMap((term) => words(term)).filter((word) => !GENERIC_PARAMS.has(stem(word)));
  const promptWords = [...new Set([...words(query), ...argWords].map(stem))];

  return getIndex()
    .map((entry) => ({ entry, score: promptWords.length ? scoreTool(entry, promptWords) : 1 }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => ({
      name: row.entry.tool.name,
      description: row.entry.tool.description,
      parameters: row.entry.tool.parameters,
      score: row.score,
    }));
}
