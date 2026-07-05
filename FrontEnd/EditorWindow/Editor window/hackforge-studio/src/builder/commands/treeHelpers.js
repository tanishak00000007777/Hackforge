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
