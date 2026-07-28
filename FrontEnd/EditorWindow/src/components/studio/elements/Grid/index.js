import Component from "./Grid";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const gridElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
