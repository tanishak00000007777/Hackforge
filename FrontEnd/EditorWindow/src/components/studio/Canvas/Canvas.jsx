import React, { useRef, useEffect, useState } from "react";
import { componentRegistry, elementRegistry } from "@/builder/registry";
import { createElement, createFromCatalogue } from "@/builder/factories/coreFactory";
import { dropIndex, reorderIndex } from "@/builder/commands/stackDrop";
import { useEditorStore } from "@/store/editorStore";
import ZoomToolbar from "../Toolbar/ZoomToolbar";
import OverlayEngine from "../Overlays/OverlayEngine";
import { computeStyles } from "@/builder/responsive/ResponsiveEngine";
import ThemeInjector from "@/builder/styles/ThemeInjector";

export default function Canvas() {
  const components = useEditorStore((state) => state.components);
  const device = useEditorStore((state) => state.device);
  const zoom = useEditorStore((state) => state.zoom);
  const pan = useEditorStore((state) => state.pan);
  
  const globalTheme = useEditorStore((state) => state.globalTheme);
  const mode = globalTheme?.mode || "light";
  const canvasBg = globalTheme?.tokens?.[mode]?.color?.canvasBackground || "#FFFFFF";
  
  const select = useEditorStore((state) => state.select);
  const hover = useEditorStore((state) => state.hover);
  const toggleSelection = useEditorStore((state) => state.toggleSelection);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  
  const hoveredComponentId = useEditorStore((state) => state.hoveredId);
  const selectedComponentId = useEditorStore((state) => state.selectedIds[0] ?? null);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  
  const isPanning = useEditorStore((state) => state.isPanning);
  const setIsPanning = useEditorStore((state) => state.setIsPanning);
  const setPan = useEditorStore((state) => state.setPan);

  const containerRef = useRef(null);

  const getCanvasWidth = () => {
    switch (device) {
      case "mobile": return 390;
      case "tablet": return 768;
      default: return 1440;
    }
  };

  // Drag state
  const draggedComponentId = useEditorStore((state) => state.draggedComponentId);
  const startDragging = useEditorStore((state) => state.startDragging);
  const stopDragging = useEditorStore((state) => state.stopDragging);
  const moveNode = useEditorStore((state) => state.moveNode);
  const insertNode = useEditorStore((state) => state.insertNode);
  const addComponent = useEditorStore((state) => state.addComponent);
  const addComponentAt = useEditorStore((state) => state.addComponentAt);
  const moveComponent = useEditorStore((state) => state.moveComponent);
  const updateComponentTransient = useEditorStore((state) => state.updateComponentTransient);
  const updateComponent = useEditorStore((state) => state.updateComponent);
  const deleteComponent = useEditorStore((state) => state.deleteComponent);
  // Where a dragged section will land: { beforeId, rect, position }. Sections
  // stack down the page, so a drop is an insertion point, not a coordinate.
  const [dropTarget, setDropTarget] = useState(null);
  const [pendingDrag, setPendingDrag] = useState(null); // { id, startX, startY }
  const isSectionType = (type) => !!componentRegistry[type];

  /** Top-level sections in page order, with their on-screen boxes. */
  const sectionRows = (excludeId = null) =>
    [...(document.getElementById("canvas-root")?.children || [])]
      .filter((el) => el.hasAttribute("data-node-id") && el.getAttribute("data-node-id") !== excludeId)
      .map((el) => ({ id: el.getAttribute("data-node-id"), rect: el.getBoundingClientRect() }))
      // Free-floating elements are not part of the stack and must not act as
      // insertion points for it.
      .filter((row) => components.some((node) => node.id === row.id && isSectionType(node.type)));

  /** Which gap in the stack the pointer is currently over. */
  const dropTargetAt = (clientY, excludeId = null) => {
    const rows = sectionRows(excludeId);
    if (!rows.length) return null;

    for (const row of rows) {
      if (clientY < row.rect.top + row.rect.height / 2) {
        return { beforeId: row.id, rect: row.rect, position: "before" };
      }
    }
    const last = rows[rows.length - 1];
    return { beforeId: null, rect: last.rect, position: "after" };
  };

  const indexOfDrop = (target) => dropIndex(components, target?.beforeId);
  // Where inside the node the user grabbed it, in canvas units. Without this the
  // node jumps so its top-left snaps under the cursor the moment dragging starts.
  const grabOffsetRef = useRef({ x: 50, y: 20 });

  // Mouse wheel to pan
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) return; // Ignore pinch-to-zoom for now
    setPan({
      x: pan.x - e.deltaX,
      y: pan.y - e.deltaY,
    });
  };

  // Middle click to pan
  const handlePointerDown = (e) => {
    if (e.button === 1 || e.altKey || e.spaceKey) {
      e.preventDefault();
      setIsPanning(true);
      return;
    }

    // Attempt to find clicked element
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const node = el?.closest("[data-node-id]");
    if (node) {
      const id = node.getAttribute("data-node-id");
      if (e.shiftKey) {
        toggleSelection(id);
      } else {
        const zoomFactor = zoom / 100;
        const nodeRect = node.getBoundingClientRect();
        grabOffsetRef.current = {
          x: (e.clientX - nodeRect.left) / zoomFactor,
          y: (e.clientY - nodeRect.top) / zoomFactor,
        };
        setPendingDrag({ id, startX: e.clientX, startY: e.clientY });
      }
    } else {
      clearSelection();
    }
  };

  const draggedSidebarComponent = useEditorStore((state) => state.draggedSidebarComponent);
  const setDraggedSidebarComponent = useEditorStore((state) => state.setDraggedSidebarComponent);

  const draggedAsset = useEditorStore((state) => state.draggedAsset);
  const setDraggedAsset = useEditorStore((state) => state.setDraggedAsset);

  const handlePointerMove = (e) => {
    if (isPanning) {
      setPan({
        x: pan.x + e.movementX,
        y: pan.y + e.movementY,
      });
      return;
    }

    if (pendingDrag) {
      const dist = Math.hypot(e.clientX - pendingDrag.startX, e.clientY - pendingDrag.startY);
      if (dist > 8) {
        startDragging(pendingDrag.id);
        setPendingDrag(null);
      } else {
        return; // still below threshold
      }
    }

    if (draggedComponentId || draggedSidebarComponent || draggedAsset) {
      // Auto Scroll near edges
      const margin = 50;
      if (e.clientY < margin) containerRef.current.scrollTop -= 10;
      if (e.clientY > window.innerHeight - margin) containerRef.current.scrollTop += 10;
      if (e.clientX < margin) containerRef.current.scrollLeft -= 10;
      if (e.clientX > window.innerWidth - margin) containerRef.current.scrollLeft += 10;

      const draggedNode = components.find((node) => node.id === draggedComponentId);

      // A section belongs in the page stack: dragging it reorders the page and
      // previews the gap it will fall into. Letting it float to a coordinate is
      // what produced overlapping, half-off-canvas pages.
      if (draggedNode && isSectionType(draggedNode.type)) {
        setDropTarget(dropTargetAt(e.clientY, draggedComponentId));
      } else if (draggedComponentId) {
        // Loose elements (a button, an image) stay freely positionable.
        const root = document.getElementById("canvas-root");
        if (root) {
          const rect = root.getBoundingClientRect();
          const zoomFactor = zoom / 100;
          const x = (e.clientX - rect.left) / zoomFactor;
          const y = (e.clientY - rect.top) / zoomFactor;
          const grab = grabOffsetRef.current;
          updateComponentTransient(draggedComponentId, {
            styles: {
              position: "absolute",
              left: `${Math.round(x - grab.x)}px`,
              top: `${Math.round(y - grab.y)}px`
            }
          });
        }
      } else if (draggedSidebarComponent && isSectionType(draggedSidebarComponent)) {
        setDropTarget(dropTargetAt(e.clientY));
      } else {
        setDropTarget(null);
      }
      return;
    }

    // Hover logic
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const node = el?.closest("[data-node-id]");
    if (node) {
      const id = node.getAttribute("data-node-id");
      hover(id);
    } else {
      hover(null);
    }
  };

  const handlePointerUp = (e) => {
    if (isPanning) {
      setIsPanning(false);
    }
    
    if (pendingDrag) {
      select(pendingDrag.id);
      setPendingDrag(null);
      return;
    }

    const calculateDropCoords = (clientX, clientY) => {
      const root = document.getElementById("canvas-root");
      if (!root) return { x: 0, y: 0 };
      const rect = root.getBoundingClientRect();
      const zoomFactor = zoom / 100;
      return {
        x: Math.round((clientX - rect.left) / zoomFactor),
        y: Math.round((clientY - rect.top) / zoomFactor)
      };
    };

    if (draggedAsset) {
      // Must be this canvas, not any <main>: the sidebar sits inside the
      // layout's own <main>, so `closest("main")` treated releasing a card
      // back over the sidebar as a drop onto the page.
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const isOverCanvas = !!el && !!containerRef.current?.contains(el);

      if (isOverCanvas) {
        const coords = calculateDropCoords(e.clientX, e.clientY);
        const newNode = createElement(draggedAsset.type === "video" ? "video" : "image");
        if (newNode) {
          newNode.props = { ...newNode.props, src: draggedAsset.url };
          newNode.styles = {
            ...newNode.styles,
            position: "absolute",
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            zIndex: "10"
          };
          addComponent(newNode);
          select(newNode.id);
        }
      }
      setDraggedAsset(null);
      setDropTarget(null);
      return;
    }

    if (draggedSidebarComponent) {
      // Must be this canvas, not any <main>: the sidebar sits inside the
      // layout's own <main>, so `closest("main")` treated releasing a card
      // back over the sidebar as a drop onto the page.
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const isOverCanvas = !!el && !!containerRef.current?.contains(el);

      if (isOverCanvas) {
        const newNode = createFromCatalogue(draggedSidebarComponent);
        if (newNode && isSectionType(draggedSidebarComponent)) {
          // Sections join the stack at the previewed gap, full width, no
          // coordinates -- exactly how the page will actually read.
          addComponentAt(newNode, indexOfDrop(dropTargetAt(e.clientY)));
          select(newNode.id);
        } else if (newNode) {
          const coords = calculateDropCoords(e.clientX, e.clientY);
          newNode.styles = {
            ...newNode.styles,
            position: "absolute",
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            zIndex: "10"
          };
          addComponent(newNode);
          // Selecting what was just dropped puts the Inspector on it straight
          // away; otherwise the next thing the organizer does is hunt for it.
          select(newNode.id);
        }
      }
      setDraggedSidebarComponent(null);
      setDropTarget(null);
      return;
    }

    if (draggedComponentId) {
      const draggedNode = components.find((node) => node.id === draggedComponentId);

      if (draggedNode && isSectionType(draggedNode.type)) {
        const from = components.findIndex((node) => node.id === draggedComponentId);
        const to = reorderIndex(from, indexOfDrop(dropTarget));
        if (to !== null) moveComponent(from, to);
      } else {
        // A loose element keeps the coordinate it was dropped at; the move so
        // far was transient, so commit it as one undoable step.
        const root = document.getElementById("canvas-root");
        if (root) {
          const rect = root.getBoundingClientRect();
          const zoomFactor = zoom / 100;
          const x = (e.clientX - rect.left) / zoomFactor;
          const y = (e.clientY - rect.top) / zoomFactor;

          const grab = grabOffsetRef.current;
          updateComponent(draggedComponentId, {
            styles: {
              position: "absolute",
              left: `${Math.round(x - grab.x)}px`,
              top: `${Math.round(y - grab.y)}px`
            }
          });
        }
      }
      stopDragging();
      setDropTarget(null);
    }
  };


  const handlePointerMoveRef = useRef(handlePointerMove);
  const handlePointerUpRef = useRef(handlePointerUp);

  useEffect(() => {
    handlePointerMoveRef.current = handlePointerMove;
    handlePointerUpRef.current = handlePointerUp;
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        // Prevent deletion if user is typing in an input or contenteditable
        const activeEl = document.activeElement;
        const isTyping = activeEl.tagName === "INPUT" || 
                         activeEl.tagName === "TEXTAREA" || 
                         activeEl.isContentEditable;
        if (!isTyping && selectedIds.length > 0) {
          e.preventDefault();
          selectedIds.forEach((id) => deleteComponent(id));
          select(null);
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, deleteComponent, select]);

  useEffect(() => {
    const onMove = (e) => handlePointerMoveRef.current(e);
    const onUp = (e) => handlePointerUpRef.current(e);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <main
      className="flex-1 overflow-hidden bg-[#FCFAFF] relative"
      onPointerDown={handlePointerDown}
      onWheel={handleWheel}
      ref={containerRef}
      // Hold the grabbing hand for the whole gesture: once the pointer leaves
      // the thin edge strip mid-drag, the strip's own cursor no longer applies.
      style={draggedComponentId ? { cursor: "grabbing" } : isPanning ? { cursor: "grabbing" } : undefined}
    >
      {/* Transform Wrapper for Pan and Zoom */}
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom / 100})`,
          transition: isPanning ? "none" : "transform 0.1s ease-out",
          width: `${getCanvasWidth()}px`,
        }}
      >
        <div
          id="canvas-root"
          className="rounded-3xl shadow-lg overflow-hidden min-h-screen relative transition-colors duration-200"
          style={{ backgroundColor: canvasBg }}
        >
          {components.map((component, index) => {
            if (component.hidden) return null;
            const registryItem = componentRegistry[component.type] || elementRegistry[component.type];
            if (!registryItem) {
              console.warn("No registry item found for type:", component.type);
              return null;
            }
            const Component = registryItem.component;
            
            const responsiveObj = component.responsive || { desktop: {}, tablet: {}, mobile: {} };
            const computedStyles = computeStyles(component.styles || {}, responsiveObj, device);

            // Check if it's an element vs section to pass correct props
            const isElement = !!elementRegistry[component.type];

            if (isElement) {
              return (
                <Component
                  key={component.id}
                  id={component.id}
                  sectionId={null} // Root elements don't belong to a section
                  type={component.type}
                  props={component.props || {}}
                  styles={computedStyles}
                  responsive={responsiveObj}
                  locked={component.locked}
                  hidden={component.hidden}
                  children={component.children || []}
                />
              );
            }

            return (
              <Component
                key={component.id}
                id={component.id}
                children={component.children}
                styles={computedStyles}
                responsive={responsiveObj}
                isHovered={hoveredComponentId === component.id}
                isSelected={selectedComponentId === component.id}
                {...component.props}
              />
            );
          })}

          <ThemeInjector />
          <OverlayEngine dropTarget={dropTarget} />
        </div>
      </div>
      
      <ZoomToolbar />
    </main>
  );
}
