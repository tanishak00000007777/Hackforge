import Component from "./List";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const listElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
