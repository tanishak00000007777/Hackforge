export function insertComponent(components, component) {
  return [...components, component];
}

export function removeComponent(components, id) {
  return components.filter((c) => c.id !== id);
}

export function duplicateComponent(components, id, generateNewNode) {
  const target = components.find((c) => c.id === id);
  if (!target) return components;
  
  const duplicated = generateNewNode(target);
  return [...components, duplicated];
}

export function moveComponent(components, fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= components.length) return components;
  
  const copy = [...components];
  const [item] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, item);
  return copy;
}

function mergeNodeData(node, changes) {
  const merged = { ...node };
  
  // If changes are structured by target (e.g., changes.styles)
  if (changes.styles !== undefined) {
    merged.styles = { ...node.styles, ...changes.styles };
  }
  if (changes.responsive !== undefined) {
    merged.responsive = { ...node.responsive };
    for (const [dev, devChanges] of Object.entries(changes.responsive)) {
      merged.responsive[dev] = { ...merged.responsive[dev], ...devChanges };
    }
  }
  if (changes.props !== undefined) {
    merged.props = { ...node.props, ...changes.props };
  }
  if (changes.hidden !== undefined) merged.hidden = changes.hidden;
  if (changes.locked !== undefined) merged.locked = changes.locked;

  // Fallback: If changes are flat, apply them to props for backward compatibility
  if (changes.props === undefined && changes.styles === undefined && changes.responsive === undefined && changes.hidden === undefined && changes.locked === undefined) {
    merged.props = { ...node.props, ...changes };
  }

  return merged;
}

export function updateComponentProps(components, id, changes) {
  return components.map((c) =>
    c.id === id ? mergeNodeData(c, changes) : c
  );
}

export function insertElement(components, sectionId, element) {
  return components.map((c) =>
    c.id === sectionId ? { ...c, children: [...(c.children || []), element] } : c
  );
}

export function removeElement(components, sectionId, elementId) {
  return components.map((c) =>
    c.id === sectionId
      ? { ...c, children: (c.children || []).filter((child) => child.id !== elementId) }
      : c
  );
}

function deepUpdateElement(children, elementId, changes) {
  if (!children) return children;
  return children.map((child) => {
    if (child.id === elementId) {
      return mergeNodeData(child, changes);
    }
    if (child.children && child.children.length > 0) {
      return { ...child, children: deepUpdateElement(child.children, elementId, changes) };
    }
    return child;
  });
}

export function updateElementProps(components, sectionId, elementId, changes) {
  return components.map((c) =>
    c.id === sectionId
      ? {
          ...c,
          children: deepUpdateElement(c.children || [], elementId, changes),
        }
      : c
  );
}

export { moveNode, insertNode } from "./treeHelpers";
