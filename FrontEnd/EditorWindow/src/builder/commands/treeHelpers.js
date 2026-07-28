// Tree traversal utilities for Drag and Drop

export function removeNodeFromTree(nodes, idToRemove) {
  let removedNode = null;

  const filterNodes = (items) => {
    if (!items) return items;
    return items.reduce((acc, item) => {
      if (item.id === idToRemove) {
        removedNode = item;
      } else {
        const newItem = { ...item };
        if (newItem.children) {
          newItem.children = filterNodes(newItem.children);
        }
        acc.push(newItem);
      }
      return acc;
    }, []);
  };

  const newTree = filterNodes(nodes);
  return { newTree, removedNode };
}

export function insertNodeIntoTree(nodes, nodeToInsert, targetId, position) {
  const mapNodes = (items) => {
    if (!items) return items;
    
    let result = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.id === targetId) {
        if (position === "before") {
          result.push(nodeToInsert);
          result.push(item);
        } else if (position === "after") {
          result.push(item);
          result.push(nodeToInsert);
        } else if (position === "inside") {
          const newItem = { ...item };
          newItem.children = [...(newItem.children || []), nodeToInsert];
          result.push(newItem);
        }
      } else {
        const newItem = { ...item };
        if (newItem.children) {
          newItem.children = mapNodes(newItem.children);
        }
        result.push(newItem);
      }
    }
    return result;
  };

  return mapNodes(nodes);
}

export function moveNode(components, sourceId, targetId, position) {
  if (sourceId === targetId) return components;

  const { newTree, removedNode } = removeNodeFromTree(components, sourceId);
  
  if (!removedNode) return components;

  return insertNodeIntoTree(newTree, removedNode, targetId, position);
}

export function insertNode(components, newNode, targetId, position) {
  return insertNodeIntoTree(components, newNode, targetId, position);
}

/* ============================================================
   DEPTH-AGNOSTIC LOOKUP
   The AI tools address nodes by id alone, with no idea which
   section a node lives in, so every structural op resolves here.
============================================================ */

export function findNodeById(nodes, id) {
  if (!nodes || !id) return null;
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return null;
}

/**
 * Resolve a node from whatever an AI actually sends. Models copy ids out of
 * prose, so a reference arrives as "heading#8ff3-...", a bare short prefix, or
 * with stray quotes. Every tool resolves model-supplied ids through here, so
 * one forgiving lookup covers all of them.
 */
export function resolveNodeRef(nodes, ref) {
  if (!nodes || typeof ref !== "string") return null;

  const cleaned = ref.trim().replace(/^["'`]|["'`]$/g, "");
  if (!cleaned) return null;

  const exact = findNodeById(nodes, cleaned);
  if (exact) return exact;

  // "heading#8ff35bfa-..." or "#8ff35bfa" -> the part after the separator
  const afterHash = cleaned.includes("#") ? cleaned.slice(cleaned.lastIndexOf("#") + 1) : cleaned;
  const byId = findNodeById(nodes, afterHash);
  if (byId) return byId;

  // A shortened id (the page outline abbreviates them) -- only when unambiguous.
  const matches = [];
  const collect = (items) => {
    for (const node of items || []) {
      if (node.id?.startsWith(afterHash)) matches.push(node);
      collect(node.children);
    }
  };
  if (afterHash.length >= 4) collect(nodes);
  return matches.length === 1 ? matches[0] : null;
}

/** Ancestor chain from root to the node itself, or null when absent. */
export function findNodePath(nodes, id, trail = []) {
  if (!nodes) return null;
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    const step = { id: node.id, type: node.type, index };
    if (node.id === id) return [...trail, step];
    const deeper = findNodePath(node.children, id, [...trail, step]);
    if (deeper) return deeper;
  }
  return null;
}

/** Parent of a node, or null when it sits at the root. */
export function findParentOf(nodes, id) {
  const path = findNodePath(nodes, id);
  if (!path || path.length < 2) return null;
  return findNodeById(nodes, path[path.length - 2].id);
}

/** Replace one node anywhere in the tree with the result of `transform`. */
export function mapNodeById(nodes, id, transform) {
  if (!nodes) return nodes;
  return nodes.map((node) => {
    if (node.id === id) return transform(node);
    if (node.children?.length) {
      return { ...node, children: mapNodeById(node.children, id, transform) };
    }
    return node;
  });
}

export function replaceNodeById(nodes, id, replacement) {
  return mapNodeById(nodes, id, () => replacement);
}

export function removeNodeById(nodes, id) {
  return removeNodeFromTree(nodes, id).newTree;
}

/* ============================================================
   STRUCTURAL OPERATIONS
============================================================ */

/** Put `wrapper` in the node's place and move the node inside it. */
export function wrapNode(nodes, id, wrapper) {
  const target = findNodeById(nodes, id);
  if (!target || !wrapper) return nodes;
  return replaceNodeById(nodes, id, { ...wrapper, children: [target] });
}

/** Splice a node's children into its own position and drop the node. */
export function unwrapNode(nodes, id) {
  const target = findNodeById(nodes, id);
  if (!target?.children?.length) return nodes;

  const splice = (items) => {
    if (!items) return items;
    return items.flatMap((node) => {
      if (node.id === id) return node.children;
      if (node.children?.length) return [{ ...node, children: splice(node.children) }];
      return [node];
    });
  };
  return splice(nodes);
}

/**
 * Collect `ids` into `wrapper`, placed where the first of them sat.
 * Only nodes sharing a parent can be grouped -- grouping across
 * containers would silently restructure the page.
 */
export function groupNodes(nodes, ids, wrapper) {
  if (!wrapper || !ids?.length) return nodes;

  const collected = ids.map((id) => findNodeById(nodes, id)).filter(Boolean);
  if (collected.length !== ids.length) return nodes;

  let stripped = nodes;
  for (const id of ids.slice(1)) stripped = removeNodeById(stripped, id);

  return replaceNodeById(stripped, ids[0], { ...wrapper, children: collected });
}

/**
 * Swap a node's type, carrying over everything the new type can still use.
 * `blank` is a fresh factory node of the target type.
 */
export function changeNodeType(nodes, id, blank) {
  const target = findNodeById(nodes, id);
  if (!target || !blank) return nodes;
  return replaceNodeById(nodes, id, {
    ...blank,
    id: target.id,
    props: { ...blank.props, ...target.props },
    styles: { ...target.styles },
    responsive: target.responsive || blank.responsive,
    children: target.children?.length ? target.children : blank.children,
    locked: target.locked,
    hidden: target.hidden,
  });
}
