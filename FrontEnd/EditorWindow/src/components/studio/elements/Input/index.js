import Component from "./Input";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const inputElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
