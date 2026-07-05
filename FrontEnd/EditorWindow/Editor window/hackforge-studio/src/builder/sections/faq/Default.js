export default {
  type: "faq",
  props: {
    background: "#FFFFFF",
    paddingTop: 96,
    paddingBottom: 96,
  },
  children: [
    {
      id: crypto.randomUUID(),
      type: "container",
      props: { className: "max-w-4xl mx-auto px-6 text-center" },
      children: [
        {
          id: crypto.randomUUID(),
          type: "heading",
          props: { text: "Frequently Asked Questions" },
          styles: { fontSize: "48px", fontWeight: 700, color: "#171C5A", marginBottom: "48px" }
        },
        {
          id: crypto.randomUUID(),
          type: "accordion",
          props: { title: "Who can participate?", className: "text-left" },
          children: [
            {
              id: crypto.randomUUID(),
              type: "paragraph",
              props: { text: "Anyone from anywhere! We welcome beginners to experts." },
              styles: { color: "#64748B" }
            }
          ]
        },
        {
          id: crypto.randomUUID(),
          type: "accordion",
          props: { title: "How much does it cost?", className: "text-left" },
          children: [
            {
              id: crypto.randomUUID(),
              type: "paragraph",
              props: { text: "It's 100% free for all accepted hackers." },
              styles: { color: "#64748B" }
            }
          ]
        }
      ],
    },
  ],
};
