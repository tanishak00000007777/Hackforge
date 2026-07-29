import { useEditorStore } from "@/store/editorStore";
import { resolveNodeRef } from "@/builder/commands/treeHelpers";

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
      availableTemplates: storeState.savedTemplates,
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

  getContextString() {
    const state = this.getState();
    const theme = state.globalTheme || {};
    const colors = theme.tokens?.[theme.mode || "light"]?.color || {};
    const selected = this.getSelectedNode();

    return `
--- SYSTEM CONTEXT ---
VIEWPORT: ${state.device}
THEME: ${theme.mode || "light"} mode, primary ${colors.primary}, background ${colors.background}, text ${colors.text}
SELECTED: ${selected ? `${selected.type} (id: ${selected.id}) ${JSON.stringify(selected.props || {}).slice(0, 200)}` : "nothing selected"}
PAGE OUTLINE — each line is: type (id: <id>) "text"
${this.outline(state.components).join("\n")}
TEMPLATES: ${(state.savedTemplates || []).map((t) => t.name).join(", ") || "none"}
When a tool asks for an id, pass ONLY the value inside (id: ...) — never the type, never "type#id".
----------------------
`;
  }
}

export const contextEngine = new ContextEngine();
