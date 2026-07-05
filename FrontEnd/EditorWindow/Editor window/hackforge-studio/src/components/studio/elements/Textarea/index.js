import Component from "./Textarea";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const textareaElement = {
  ...schema,
  component: Component,
  defaultProps,
  inspector,
};
