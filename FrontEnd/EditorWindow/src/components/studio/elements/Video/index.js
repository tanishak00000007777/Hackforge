import Component from "./Video";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const videoElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
