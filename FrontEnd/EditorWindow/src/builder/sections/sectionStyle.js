/**
 * Style precedence for a section shell.
 *
 * A section's background and padding can be written from three places:
 *   props            section defaults, and the Inspector's "props" fields
 *   styles           explicit style edits (AI tools, style presets)
 *   responsive[dev]  the Inspector's per-breakpoint fields
 *
 * The last two arrive already merged as `props.styles` (Canvas runs them
 * through computeStyles). Every section Preview used to spread that FIRST and
 * then re-apply `background: props.background ?? "#FFF"`, so an explicit edit
 * was overwritten by the default and the canvas never changed -- the AI would
 * correctly report "Done" for a change nobody could see.
 *
 * Defaults are defaults: they go first, explicit styles win.
 */
export function sectionStyle(props, defaults = {}) {
  const { background = "#FFFFFF", paddingTop = 96, paddingBottom = 96 } = defaults;

  return {
    background: props.background ?? background,
    paddingTop: `${props.paddingTop ?? paddingTop}px`,
    paddingBottom: `${props.paddingBottom ?? paddingBottom}px`,
    ...props.styles,
  };
}

/**
 * Style keys that duplicate a section prop. When the Inspector writes the prop,
 * these are cleared so its edit is not masked by an earlier style edit --
 * whichever the user touched last is what they see.
 */
export const SECTION_STYLE_ALIASES = {
  background: ["background", "backgroundColor"],
  paddingTop: ["paddingTop"],
  paddingBottom: ["paddingBottom"],
};
