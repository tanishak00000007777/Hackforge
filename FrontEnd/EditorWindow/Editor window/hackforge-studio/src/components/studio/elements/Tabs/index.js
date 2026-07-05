import Component from "./Tabs";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const tabsElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
