import React from "react";

/**
 * A grab strip along each edge of the selection.
 *
 * The selection outline is pointer-events-none, so hovering the border of a
 * selected node gave no hint that it can be dragged. These strips show the
 * grab hand and start the existing canvas drag.
 *
 * `data-node-id` is what makes that work: Canvas hit-tests with
 * `elementFromPoint(...).closest("[data-node-id]")`, so without it a press on
 * the overlay would resolve to no node and clear the selection instead of
 * moving it.
 */
const BAND = 10; // px of grabbable edge, inside and outside the outline

const EDGES = {
  top: { top: -BAND / 2, left: 0, right: 0, height: BAND },
  bottom: { bottom: -BAND / 2, left: 0, right: 0, height: BAND },
  left: { left: -BAND / 2, top: 0, bottom: 0, width: BAND },
  right: { right: -BAND / 2, top: 0, bottom: 0, width: BAND },
};

export default function MoveBand({ id }) {
  return (
    <>
      {Object.entries(EDGES).map(([edge, style]) => (
        <div
          key={edge}
          data-node-id={id}
          aria-hidden="true"
          className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
          style={{ position: "absolute", ...style }}
        />
      ))}
    </>
  );
}
