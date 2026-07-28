export default {
  type: "tracks",
  props: {
    background: "#F8FAFC",
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
          props: {
            text: "Hackathon Tracks",
          },
          styles: {
            fontSize: "48px",
            fontWeight: 700,
            color: "#171C5A",
            fontFamily: "Inter",
          },
        },
        {
          id: crypto.randomUUID(),
          type: "paragraph",
          props: {
            text: "Showcase the challenge categories for participants.",
            className: "mt-4 mb-16",
          },
          styles: {
            fontSize: "20px",
            color: "#64748B",
            fontFamily: "Inter",
          },
        },
        {
          id: crypto.randomUUID(),
          type: "grid",
          props: {
            columns: 2,
            gap: 32,
            className: "max-w-4xl mx-auto",
          },
          children: [
            {
              id: crypto.randomUUID(),
              type: "card",
              props: {
                background: "#FFFFFF",
                padding: 32,
                className: "text-left border border-slate-200",
              },
              children: [
                {
                  id: crypto.randomUUID(),
                  type: "heading",
                  props: { text: "DeFi Innovation" },
                  styles: { fontSize: "24px", fontWeight: "bold", color: "#171C5A", marginBottom: "8px" },
                },
                {
                  id: crypto.randomUUID(),
                  type: "paragraph",
                  props: { text: "Reimagine financial tools for the next billion users." },
                  styles: { color: "#64748B" },
                }
              ]
            },
            {
              id: crypto.randomUUID(),
              type: "card",
              props: {
                background: "#FFFFFF",
                padding: 32,
                className: "text-left border border-slate-200",
              },
              children: [
                {
                  id: crypto.randomUUID(),
                  type: "heading",
                  props: { text: "Web3 Gaming" },
                  styles: { fontSize: "24px", fontWeight: "bold", color: "#171C5A", marginBottom: "8px" },
                },
                {
                  id: crypto.randomUUID(),
                  type: "paragraph",
                  props: { text: "Building immersive experiences with true ownership." },
                  styles: { color: "#64748B" },
                }
              ]
            }
          ],
        },
      ],
    },
  ],
};
