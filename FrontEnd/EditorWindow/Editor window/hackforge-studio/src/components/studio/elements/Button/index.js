import Component from "./Button";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const buttonElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
