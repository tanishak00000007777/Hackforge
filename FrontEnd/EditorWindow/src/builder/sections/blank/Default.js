// An empty, neutral section. Every other section is a pre-built hackathon
// layout; this is the one to reach for when someone asks for "a new section"
// and intends to fill it themselves.
export default {
  type: "blank",
  props: {
    background: "#FFFFFF",
    paddingTop: 96,
    paddingBottom: 96,
  },
  children: [
    {
      id: crypto.randomUUID(),
      type: "container",
      props: { className: "px-6 max-w-[1200px] mx-auto" },
      children: [],
    },
  ],
};
