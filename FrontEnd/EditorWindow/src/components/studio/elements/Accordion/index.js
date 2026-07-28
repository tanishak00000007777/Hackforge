import Component from "./Accordion";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const accordionElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
