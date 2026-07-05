import Component from "./Container";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const containerElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
