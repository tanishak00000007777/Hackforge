export function findElement(section, id) {
  return section.children.find(
    (element) => element.id === id
  );
}