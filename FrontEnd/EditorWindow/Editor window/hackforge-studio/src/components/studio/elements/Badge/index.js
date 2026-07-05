import Component from "./Badge";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const badgeElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
