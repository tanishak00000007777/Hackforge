import Component from "./Row";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const rowElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
