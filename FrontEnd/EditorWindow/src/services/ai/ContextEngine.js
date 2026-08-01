import { useEditorStore } from "@/store/editorStore";
import { resolveNodeRef } from "@/builder/commands/treeHelpers";
import { listTemplates } from "@/builder/registry/templates";

export class ContextEngine {
  constructor() {
    this.snapshot = {};
  }

  /**
   * Read the live store. Tools run after updateSnapshot() but may also run
   * back-to-back inside one batch, where an earlier tool already changed the
   * tree -- so reads go to the store, not the frozen snapshot.
   */
  getState() {
    return useEditorStore.getState();
  }

  /** Frozen context captured for the LLM prompt, plus live components. */
  getSnapshot() {
    const state = this.getState();
    return { ...this.snapshot, components: state.components, globalTheme: state.globalTheme };
  }

  /** The single selected node, or null. Tools fall back to this when given no id. */
  getSelectedNode() {
    const state = this.getState();
    const id = state.selectedIds?.[0];
    return id ? resolveNodeRef(state.components, id) : null;
  }

  /** Resolve an explicit id, else the current selection. */
  resolveNode(id) {
    const state = this.getState();
    return id ? resolveNodeRef(state.components, id) : this.getSelectedNode();
  }

  updateSnapshot(storeState) {
    // Collect all requested context
    this.snapshot = {
      currentPageTree: storeState.components,
      selectedComponentIds: storeState.selectedIds,
      selectedComponentData: storeState.selectedIds.map(id => 
        this.findNode(storeState.components, id)
      ),
      globalTheme: storeState.globalTheme,
      viewport: storeState.device,
      availableTemplates: listTemplates(storeState.savedTemplates),
      undoHistorySize: storeState.history.length
    };
  }

  findNode(nodes, id) {
    return resolveNodeRef(nodes, id);
  }

  /**
   * A one-line-per-node outline instead of the tree as JSON. The full JSON ran
   * ~85 tokens per node, which blew the request budget on any real page; this
   * is ~15, and anything deeper is one inspectComponent call away.
   */
  outline(nodes, depth = 0, lines = [], maxLines = 60) {
    for (const node of nodes || []) {
      if (lines.length >= maxLines) {
        lines.push(`${"  ".repeat(depth)}... (truncated, use getComponentTree for the rest)`);
        return lines;
      }
      const text = ["text", "title", "label", "heading"]
        .map((key) => node.props?.[key])
        .find((value) => typeof value === "string" && value.trim());

      // Never glue the type to the id: models copy "heading#<id>" verbatim
      // into tool arguments. Keep them visibly separate fields.
      lines.push(
        `${"  ".repeat(depth)}${node.type} (id: ${node.id})` +
          (text ? ` "${text.slice(0, 40)}"` : "") +
          (node.hidden ? " [hidden]" : ""),
      );
      this.outline(node.children, depth + 1, lines, maxLines);
    }
    return lines;
  }

  /** What the page is made of, so page-level requests do not need a selection. */
  composition(components = []) {
    if (!components.length) return "EMPTY PAGE — nothing has been added yet.";

    const types = components.map((node) => node.type);
    const counts = types.reduce((acc, type) => ({ ...acc, [type]: (acc[type] || 0) + 1 }), {});
    const present = Object.entries(counts).map(([type, count]) => (count > 1 ? `${type} x${count}` : type));
    const expected = ["hero", "about", "tracks", "timeline", "sponsors", "faq", "footer"];
    const missing = expected.filter((type) => !types.includes(type));

    return [
      `SECTIONS (top to bottom): ${present.join(" -> ")}`,
      missing.length ? `NOT ON THE PAGE YET: ${missing.join(", ")}` : "All common sections are present.",
    ].join("\n");
  }

  /** Theme values the design rules refer to by name, so styling uses real tokens. */
  themeString(theme = {}) {
    const tokens = theme.tokens?.[theme.mode || "light"] || {};
    const { color = {}, typography = {}, radius = {}, shadow = {} } = tokens;
    return [
      `MODE: ${theme.mode || "light"}`,
      `COLOR TOKENS: ${Object.entries(color).map(([key, value]) => `${key}=${value}`).join(", ") || "none"}`,
      `TYPE: font ${typography.fontFamily || "Inter"}, heading ${typography.headingSize || "?"}/${typography.headingWeight || "?"}, body ${typography.subtitleSize || "?"}`,
      `RADIUS: button ${radius.button || "?"}, card ${radius.card || "?"} | SHADOW: card ${shadow.card || "none"}`,
    ].join("\n");
  }

  getContextString() {
    const state = this.getState();
    const theme = state.globalTheme || {};
    const selected = this.getSelectedNode();

    return `
--- SYSTEM CONTEXT ---
VIEWPORT: ${state.device}
${this.themeString(theme)}
SELECTED: ${selected ? `${selected.type} (id: ${selected.id}) ${JSON.stringify(selected.props || {}).slice(0, 200)}` : "nothing selected — resolve the target from the outline below, do not ask the user to select"}
SELECTION SCOPE: ${selected ? "Unscoped edits such as \"change the background colour\" apply ONLY to this selected node. Use component styling tools and omit the id so selection is the target. Use theme/global tools only when the user explicitly asks for the whole site, page, theme, or all sections." : "No selected node; resolve the target from the user's words and the outline."}
PAGE COMPOSITION
${this.composition(state.components)}
PAGE OUTLINE — each line is: type (id: <id>) "text"
${this.outline(state.components).join("\n")}
TEMPLATES: ${listTemplates(state.savedTemplates || []).map((t) => t.name).join(", ") || "none"}
When a tool asks for an id, pass ONLY the value inside (id: ...) — never the type, never "type#id".
----------------------
`;
  }
}

export const contextEngine = new ContextEngine();
