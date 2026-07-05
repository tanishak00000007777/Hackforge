export function findSection(components, id) {
  return components.find(
    (component) => component.id === id
  );
}