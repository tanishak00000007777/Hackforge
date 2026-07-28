import { defineTool, ok, fail, resolveTarget } from "./defineTool";
import { editorAdapter } from "../EditorAdapter";
import { aiProvider } from "../providers/AIProvider";

/** Components keep their copy under different prop names. */
const TEXT_PROPS = ["text", "title", "label", "content", "heading", "subtitle"];

function textPropOf(node) {
  const key = TEXT_PROPS.find((prop) => typeof node.props?.[prop] === "string" && node.props[prop].trim());
  return key ? { key, value: node.props[key] } : null;
}

/**
 * All content tools are the same shape: take a node's existing copy, ask the
 * model to transform it, write the result back. Only the instruction differs.
 */
async function transformText({ context, componentId, instruction, apply = true, extra = {} }) {
  const { node, error } = resolveTarget(context, componentId);
  if (error) return fail(error);

  const found = textPropOf(node);
  if (!found) {
    return fail(`Component '${node.id}' (${node.type}) has no text to work with. Expected one of: ${TEXT_PROPS.join(", ")}.`);
  }

  const system =
    "You rewrite website copy. Return ONLY the rewritten text: no quotes, no preamble, no markdown, " +
    "no explanation. Preserve the original meaning unless told otherwise, and keep a similar length " +
    "unless the instruction says otherwise.";

  let result;
  try {
    result = await aiProvider.sendPrompt(system, [
      { role: "user", content: `${instruction}\n\nText:\n${found.value}` },
    ], []);
  } catch (err) {
    return fail(`The language model call failed: ${err.message}`);
  }

  const rewritten = (result?.message || "").trim().replace(/^["']|["']$/g, "");
  if (!rewritten) return fail("The language model returned no text.");

  if (apply) editorAdapter.updateNode(node.id, { props: { [found.key]: rewritten } });

  return ok({ componentId: node.id, prop: found.key, original: found.value, result: rewritten, applied: apply, ...extra });
}

const baseParams = (extra = {}) => ({
  type: "object",
  properties: {
    componentId: { type: "string", description: "Component whose text to change. Defaults to the current selection." },
    apply: { type: "boolean", description: "Write the result back to the component (default true). false previews only." },
    ...extra,
  },
});

export const setContent = defineTool({
  name: "setContent",
  description: "Sets a heading, paragraph, button, or other component's text to an exact value without paraphrasing it.",
  parameters: {
    type: "object",
    properties: {
      componentId: { type: "string", description: "Component whose text to replace." },
      value: { type: "string", description: "Exact text to place in the component." },
    },
    required: ["componentId", "value"],
  },
  execute: ({ componentId, value }, context) => {
    if (typeof value !== "string" || !value.trim()) return fail("value is required.");

    const { node, error } = resolveTarget(context, componentId);
    if (error) return fail(error);

    const found = textPropOf(node);
    if (!found) return fail(`Component '${node.id}' (${node.type}) has no editable text.`);

    const nextValue = value.trim();
    editorAdapter.updateNode(node.id, { props: { [found.key]: nextValue } });
    return ok({
      componentId: node.id,
      prop: found.key,
      original: found.value,
      result: nextValue,
      applied: true,
    });
  },
});

export const rewriteContent = defineTool({
  name: "rewriteContent",
  description: "Rewrites a component's text following an instruction, e.g. 'make it punchier' or 'aim it at enterprise buyers'.",
  parameters: baseParams({
    instruction: { type: "string", description: "How to rewrite it." },
  }),
  execute: ({ componentId, instruction, apply }, context) => {
    if (!instruction?.trim()) return fail("instruction is required, e.g. 'make it shorter and more direct'.");
    return transformText({ context, componentId, apply, instruction: `Rewrite this text: ${instruction}.` });
  },
});

export const summarizeContent = defineTool({
  name: "summarizeContent",
  description: "Shortens a component's text to its essential message.",
  parameters: baseParams({
    maxWords: { type: "number", description: "Target maximum word count (default 20)." },
  }),
  execute: ({ componentId, maxWords = 20, apply }, context) =>
    transformText({
      context, componentId, apply,
      instruction: `Summarize this text into at most ${maxWords} words, keeping the key message.`,
      extra: { maxWords },
    }),
});

export const translateContent = defineTool({
  name: "translateContent",
  description: "Translates a component's text into another language.",
  parameters: baseParams({
    language: { type: "string", description: "Target language, e.g. 'Spanish', 'Japanese'." },
  }),
  execute: ({ componentId, language, apply }, context) => {
    if (!language?.trim()) return fail("language is required, e.g. 'French'.");
    return transformText({
      context, componentId, apply,
      instruction: `Translate this text into ${language}. Keep the tone and any product names unchanged.`,
      extra: { language },
    });
  },
});

export const fixGrammar = defineTool({
  name: "fixGrammar",
  description: "Corrects spelling, grammar and punctuation without changing the meaning or voice.",
  parameters: baseParams(),
  execute: ({ componentId, apply }, context) =>
    transformText({
      context, componentId, apply,
      instruction: "Fix any spelling, grammar and punctuation errors. Change nothing else: keep the wording, voice and length.",
    }),
});

export const changeTone = defineTool({
  name: "changeTone",
  description: "Rewrites a component's text in a different tone of voice.",
  parameters: baseParams({
    tone: {
      type: "string",
      enum: ["professional", "friendly", "playful", "confident", "technical", "urgent", "minimal"],
      description: "Tone to adopt.",
    },
  }),
  execute: ({ componentId, tone, apply }, context) => {
    if (!tone?.trim()) return fail("tone is required, e.g. 'professional'.");
    return transformText({
      context, componentId, apply,
      instruction: `Rewrite this text in a ${tone} tone, keeping the same meaning and roughly the same length.`,
      extra: { tone },
    });
  },
});

export const contentTools = [setContent, rewriteContent, summarizeContent, translateContent, fixGrammar, changeTone];
