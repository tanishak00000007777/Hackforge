import Component from "./Countdown";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const countdownElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
