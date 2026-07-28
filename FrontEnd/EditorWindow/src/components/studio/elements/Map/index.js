import Component from "./Map";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const mapElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
