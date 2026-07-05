import Component from "./Paragraph";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const paragraphElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
