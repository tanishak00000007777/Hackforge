import Component from "./Heading";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const headingElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
