/**
 * Structured diff between two component trees.
 *
 * The copilot applies AI edits straight to the canvas. Undo can reverse them,
 * but the user never sees WHAT changed -- so this turns before/after into a
 * reviewable list, the same safety story the PersonaForge flow already has.
 */

const TEXT_PROPS = ["text", "title", "label", "content", "heading"];

const labelOf = (node) => {
  const text = TEXT_PROPS.map((key) => node.props?.[key]).find((value) => typeof value === "string" && value.trim());
  return text ? `${node.type} "${text.slice(0, 40)}"` : node.type;
};

function countDescendants(node) {
  return (node.children || []).reduce((total, child) => total + 1 + countDescendants(child), 0);
}

function index(nodes, map = new Map(), parentId = null, depth = 0) {
  for (const node of nodes || []) {
    map.set(node.id, { node, parentId, depth });
    index(node.children, map, node.id, depth + 1);
  }
  return map;
}

/** Shallow field-by-field comparison of two plain objects. */
function objectChanges(before = {}, after = {}) {
  const changes = [];
  for (const key of new Set([...Object.keys(before || {}), ...Object.keys(after || {})])) {
    const from = before?.[key];
    const to = after?.[key];
    if (JSON.stringify(from) === JSON.stringify(to)) continue;
    changes.push({ key, from: from ?? null, to: to ?? null });
  }
  return changes;
}

/**
 * Returns { changed, summary, added[], removed[], modified[] }.
 * `modified` entries carry the exact props/styles fields that differ, so the
 * UI can show "color: #171C5A -> #2563eb" rather than "something changed".
 */
export function diffTrees(before, after) {
  const beforeIndex = index(before);
  const afterIndex = index(after);

  const added = [];
  const removed = [];
  const modified = [];

  // A new section arrives with its own children. Reporting "added blank,
  // added container" reads as two separate actions, so only the outermost new
  // node is listed -- its subtree came with it.
  const isNewSubtreeRoot = (entry, index) => !entry.parentId || index.has(entry.parentId);

  for (const [id, entry] of afterIndex) {
    if (beforeIndex.has(id)) continue;
    if (!isNewSubtreeRoot(entry, beforeIndex)) continue;

    const descendants = countDescendants(entry.node);
    added.push({
      id,
      type: entry.node.type,
      label: labelOf(entry.node),
      parentId: entry.parentId,
      ...(descendants ? { descendants } : {}),
    });
  }

  for (const [id, entry] of beforeIndex) {
    if (!afterIndex.has(id)) {
      // Same collapsing on the way out: deleting a section is one action.
      if (isNewSubtreeRoot(entry, afterIndex)) {
        const descendants = countDescendants(entry.node);
        removed.push({
          id,
          type: entry.node.type,
          label: labelOf(entry.node),
          parentId: entry.parentId,
          ...(descendants ? { descendants } : {}),
        });
      }
      continue;
    }

    const previous = entry.node;
    const current = afterIndex.get(id).node;

    const props = objectChanges(previous.props, current.props);
    const styles = objectChanges(previous.styles, current.styles);
    const responsive = objectChanges(previous.responsive, current.responsive);

    const flags = [];
    if (!!previous.hidden !== !!current.hidden) flags.push({ key: "hidden", from: !!previous.hidden, to: !!current.hidden });
    if (!!previous.locked !== !!current.locked) flags.push({ key: "locked", from: !!previous.locked, to: !!current.locked });

    // Reordering or reparenting shows up as a child-list change, not a prop.
    const beforeChildren = (previous.children || []).map((child) => child.id).join(",");
    const afterChildren = (current.children || []).map((child) => child.id).join(",");
    const movedChildren = beforeChildren !== afterChildren;

    if (props.length || styles.length || responsive.length || flags.length || movedChildren) {
      modified.push({
        id,
        type: current.type,
        label: labelOf(current),
        props,
        styles,
        responsive,
        flags,
        childrenReordered: movedChildren,
      });
    }
  }

  const parts = [];
  if (added.length) parts.push(`${added.length} added`);
  if (removed.length) parts.push(`${removed.length} removed`);
  if (modified.length) parts.push(`${modified.length} changed`);

  return {
    changed: added.length + removed.length + modified.length > 0,
    summary: parts.join(", ") || "no changes",
    added,
    removed,
    modified,
  };
}

/** One human-readable line per change, for a compact review list. */
export function describeDiff(diff, limit = 12) {
  const withCount = (entry) => (entry.descendants ? `${entry.label} (+${entry.descendants} inside)` : entry.label);

  const lines = [
    ...diff.added.map((entry) => `Added ${withCount(entry)}`),
    ...diff.removed.map((entry) => `Removed ${withCount(entry)}`),
    ...diff.modified.map((entry) => {
      const fields = [...entry.props, ...entry.styles]
        .slice(0, 3)
        .map((change) => `${change.key}: ${JSON.stringify(change.from)} → ${JSON.stringify(change.to)}`);
      if (!fields.length) {
        if (entry.flags.length) return `${entry.label}: ${entry.flags.map((f) => `${f.key} → ${f.to}`).join(", ")}`;
        if (entry.childrenReordered) return `${entry.label}: children reordered`;
        if (entry.responsive.length) return `${entry.label}: responsive overrides updated`;
      }
      return `${entry.label}: ${fields.join(", ")}`;
    }),
  ];
  return lines.slice(0, limit);
}
