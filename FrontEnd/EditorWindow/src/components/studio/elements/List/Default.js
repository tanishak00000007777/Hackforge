export default {
  type: "list",
  props: {
    // Items are plain strings so the AI can set them in one updateNode call
    // rather than creating a child element per bullet.
    items: ["First point", "Second point", "Third point"],
    ordered: false,
    marker: "disc",
  },
  styles: {},
  responsive: { desktop: {}, tablet: {}, mobile: {} },
  children: [],
  locked: false,
  hidden: false,
};
