import { componentRegistry, elementRegistry } from "@/builder/registry";

function assignIds(node) {
  if (!node) return node;
  node.id = crypto.randomUUID();
  if (node.children && Array.isArray(node.children)) {
    node.children = node.children.map((child) => assignIds(child));
  }
  return node;
}

export function createComponent(type) {
  const registryItem = componentRegistry[type];
  if (!registryItem || !registryItem.defaultProps) {
    console.warn(`No template found for section type: ${type}`);
    return null;
  }
  const cloned = structuredClone(registryItem.defaultProps);
  return assignIds(cloned);
}

export function createElement(type) {
  const registryItem = elementRegistry[type];
  if (!registryItem || !registryItem.defaultProps) {
    console.warn(`No template found for element type: ${type}`);
    return null;
  }
  
  const cloned = structuredClone(registryItem.defaultProps);
  const element = {
    parentId: null,
    ...cloned,
    children: cloned.children ?? [],
    styles: cloned.styles ?? {},
    responsive: {
      desktop: {},
      tablet: {},
      mobile: {},
    },
    locked: false,
    hidden: false,
  };
  return assignIds(element);
}

export function duplicateNode(node) {
  const cloned = structuredClone(node);
  return assignIds(cloned);
}
