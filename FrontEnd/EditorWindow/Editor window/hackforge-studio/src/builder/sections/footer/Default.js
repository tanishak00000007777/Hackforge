export default {
  type: "footer",
  props: {
    background: "#0F172A",
    paddingTop: 64,
    paddingBottom: 64,
  },
  children: [
    {
      id: crypto.randomUUID(),
      type: "container",
      props: { className: "max-w-6xl mx-auto px-6" },
      children: [
        {
          id: crypto.randomUUID(),
          type: "row",
          props: { justifyContent: "space-between", alignItems: "center" },
          children: [
            {
              id: crypto.randomUUID(),
              type: "column",
              props: { gap: 8 },
              children: [
                {
                  id: crypto.randomUUID(),
                  type: "heading",
                  props: { text: "Web3 Challenge" },
                  styles: { fontSize: "24px", fontWeight: "bold", color: "#FFFFFF" }
                },
                {
                  id: crypto.randomUUID(),
                  type: "paragraph",
                  props: { text: "Building the decentralized future." },
                  styles: { color: "#94A3B8" }
                }
              ]
            },
            {
              id: crypto.randomUUID(),
              type: "row",
              props: { gap: 24 },
              children: [
                {
                  id: crypto.randomUUID(),
                  type: "button",
                  props: { text: "Code of Conduct", className: "text-sm hover:underline" },
                  styles: { color: "#E2E8F0", background: "transparent" }
                },
                {
                  id: crypto.randomUUID(),
                  type: "button",
                  props: { text: "Privacy Policy", className: "text-sm hover:underline" },
                  styles: { color: "#E2E8F0", background: "transparent" }
                }
              ]
            }
          ]
        },
        {
          id: crypto.randomUUID(),
          type: "divider",
          props: { color: "#1E293B", className: "mt-8 mb-8" }
        },
        {
          id: crypto.randomUUID(),
          type: "paragraph",
          props: { text: "© 2026 Web3 Challenge. All rights reserved.", className: "text-center text-xs" },
          styles: { color: "#94A3B8" }
        }
      ],
    },
  ],
};
