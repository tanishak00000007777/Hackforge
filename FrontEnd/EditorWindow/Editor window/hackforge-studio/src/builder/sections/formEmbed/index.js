import Preview from "./Preview";
import defaultProps from "./Default";
import schema from "./Schema";
import inspector from "./Inspector";

export const formEmbedSection = { ...schema, component: Preview, defaultProps, inspector };
