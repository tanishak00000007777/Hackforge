export default {
  type: "sponsors",
  props: {
    background: "#FFFFFF",
    paddingTop: 96,
    paddingBottom: 96,
  },
  children: [
    {
      id: crypto.randomUUID(),
      type: "container",
      props: { className: "text-center px-6" },
      children: [
        {
          id: crypto.randomUUID(),
          type: "heading",
          props: { text: "Our Sponsors" },
          styles: { fontSize: "48px", fontWeight: 700, color: "#171C5A", marginBottom: "48px" }
        },
        {
          id: crypto.randomUUID(),
          type: "grid",
          props: { columns: 3, gap: 32 },
          children: [
            {
              id: crypto.randomUUID(),
              type: "card",
              props: { background: "#F8FAFC", className: "flex items-center justify-center h-32" },
              children: [
                {
                  id: crypto.randomUUID(),
                  type: "paragraph",
                  props: { text: "Sponsor Logo 1" },
                  styles: { color: "#94A3B8", fontWeight: "bold" }
                }
              ]
            },
            {
              id: crypto.randomUUID(),
              type: "card",
              props: { background: "#F8FAFC", className: "flex items-center justify-center h-32" },
              children: [
                {
                  id: crypto.randomUUID(),
                  type: "paragraph",
                  props: { text: "Sponsor Logo 2" },
                  styles: { color: "#94A3B8", fontWeight: "bold" }
                }
              ]
            }
          ]
        }
      ],
    },
  ],
};
