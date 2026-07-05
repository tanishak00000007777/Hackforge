import Component from "./Card";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const cardElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
