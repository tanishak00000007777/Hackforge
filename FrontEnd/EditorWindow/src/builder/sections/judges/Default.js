export default {
  type: "judges",
  props: {
    background: "#F8FAFC",
    paddingTop: 96,
    paddingBottom: 96,
  },
  children: [
    {
      id: crypto.randomUUID(),
      type: "container",
      props: { className: "text-center px-6 max-w-6xl mx-auto" },
      children: [
        {
          id: crypto.randomUUID(),
          type: "heading",
          props: { text: "Meet The Judges" },
          styles: { fontSize: "48px", fontWeight: 700, color: "#171C5A", marginBottom: "48px" }
        },
        {
          id: crypto.randomUUID(),
          type: "grid",
          props: { columns: 4, gap: 32 },
          children: [
            {
              id: crypto.randomUUID(),
              type: "card",
              props: { padding: 0, className: "bg-white overflow-hidden text-left" },
              children: [
                {
                  id: crypto.randomUUID(),
                  type: "image",
                  props: { src: "https://via.placeholder.com/400x400?text=Avatar", className: "w-full aspect-square object-cover bg-slate-200" }
                },
                {
                  id: crypto.randomUUID(),
                  type: "column",
                  props: { padding: 24, gap: 4, className: "p-6" },
                  children: [
                    {
                      id: crypto.randomUUID(),
                      type: "heading",
                      props: { text: "Alice Smith" },
                      styles: { fontSize: "18px", fontWeight: "bold", color: "#171C5A" }
                    },
                    {
                      id: crypto.randomUUID(),
                      type: "paragraph",
                      props: { text: "CTO, TechCorp" },
                      styles: { fontSize: "14px", color: "#64748B" }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
    },
  ],
};
