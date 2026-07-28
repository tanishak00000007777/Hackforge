import { useEditorStore } from "@/store/editorStore";

/**
 * EditorAdapter provides a safe, decoupled interface 
 * for the AI to execute commands against the editor store.
 */
class EditorAdapter {
  addComponent(node) {
    const store = useEditorStore.getState();
    store.addComponent(node);
  }

  updateComponent(id, changes) {
    const store = useEditorStore.getState();
    store.updateComponent(id, changes);
  }

  deleteComponent(id) {
    const store = useEditorStore.getState();
    store.deleteComponent(id);
  }

  updateElement(sectionId, elementId, changes) {
    const store = useEditorStore.getState();
    store.updateElement(sectionId, elementId, changes);
  }

  deleteElement(sectionId, elementId) {
    const store = useEditorStore.getState();
    store.removeElement(sectionId, elementId);
  }

  duplicateComponent(id) {
    const store = useEditorStore.getState();
    store.duplicateComponent(id);
  }

  /* --- depth-agnostic tree ops (see store TREE API) --- */

  updateNode(id, changes) {
    useEditorStore.getState().updateNode(id, changes);
  }

  deleteNode(id) {
    useEditorStore.getState().deleteNode(id);
  }

  replaceNode(id, node) {
    useEditorStore.getState().replaceNode(id, node);
  }

  insertNode(node, targetId, position) {
    useEditorStore.getState().insertNode(node, targetId, position);
  }

  moveNode(sourceId, targetId, position) {
    useEditorStore.getState().moveNode(sourceId, targetId, position);
  }

  moveComponent(fromIndex, toIndex) {
    useEditorStore.getState().moveComponent(fromIndex, toIndex);
  }

  wrapNode(id, wrapper) {
    useEditorStore.getState().wrapNode(id, wrapper);
  }

  unwrapNode(id) {
    useEditorStore.getState().unwrapNode(id);
  }

  groupNodes(ids, wrapper) {
    useEditorStore.getState().groupNodes(ids, wrapper);
  }

  changeNodeType(id, blank) {
    useEditorStore.getState().changeNodeType(id, blank);
  }

  /* --- canvas / viewport / selection / history --- */

  setDevice(device) {
    useEditorStore.getState().setDevice(device);
  }

  setZoom(zoom) {
    useEditorStore.getState().setZoom(zoom);
  }

  setPan(pan) {
    useEditorStore.getState().setPan(pan);
  }

  select(id) {
    useEditorStore.getState().select(id);
  }

  toggleSelection(id) {
    useEditorStore.getState().toggleSelection(id);
  }

  clearSelection() {
    useEditorStore.getState().clearSelection();
  }

  undo() {
    useEditorStore.getState().undo();
  }

  redo() {
    useEditorStore.getState().redo();
  }
}
export const editorAdapter = new EditorAdapter();
