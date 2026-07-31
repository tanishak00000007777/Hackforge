/**
 * Where a dragged section lands in the page stack.
 *
 * Sections are laid out top to bottom, so a drop is an index between two of
 * them, not an x/y coordinate. The canvas resolves the pointer to "before this
 * section" (or the end of the page) and these two functions turn that into the
 * index the store commands expect.
 */

/** Insertion index for a NEW section placed before `beforeId` (null = append). */
export function dropIndex(components, beforeId) {
  if (!beforeId) return components.length;
  const index = components.findIndex((node) => node.id === beforeId);
  return index === -1 ? components.length : index;
}

/**
 * Target index for MOVING the section at `from` to the same gap.
 *
 * `moveComponent` splices the section out before putting it back, so every gap
 * below it shifts up by one. Without this correction, dragging a section
 * downwards always lands it one slot short of the line that was drawn.
 * Returns null when the move is a no-op.
 */
export function reorderIndex(from, to) {
  if (from === -1) return null;
  const target = from < to ? to - 1 : to;
  return target === from ? null : target;
}

/**
 * Return absolutely-positioned sections to the page flow.
 *
 * Older builds dropped sections at the cursor's x/y, so saved pages contain
 * full-width sections pinned to coordinates -- they overlap each other and hang
 * off the side of the canvas. Loading a page repairs it. Loose elements (a
 * button, an image) are left pinned: for those, a coordinate is the point.
 *
 * `isSection` is injected so this stays free of the component registry, which
 * pulls in JSX.
 */
export function unpinSections(components, isSection) {
  return (components || []).map((node) => {
    if (!isSection(node.type) || node.styles?.position !== "absolute") return node;
    const { position, left, top, right, bottom, zIndex, ...styles } = node.styles;
    return { ...node, styles };
  });
}
