import Component from "./Image";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const imageElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
