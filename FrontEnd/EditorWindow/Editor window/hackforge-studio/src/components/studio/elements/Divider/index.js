import Component from "./Divider";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const dividerElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
