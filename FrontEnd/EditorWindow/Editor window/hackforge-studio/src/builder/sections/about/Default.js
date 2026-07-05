export default {
  type: "about",
  props: {
    background: "#F8FAFC",
    paddingTop: 96,
    paddingBottom: 96,
  },
  children: [
    {
      id: crypto.randomUUID(),
      type: "container",
      props: { className: "px-6" },
      children: [
        {
          id: crypto.randomUUID(),
          type: "grid",
          props: { columns: 2, gap: 48, className: "items-center" },
          children: [
            {
              id: crypto.randomUUID(),
              type: "column",
              props: {},
              children: [
                {
                  id: crypto.randomUUID(),
                  type: "heading",
                  props: { text: "About the Hackathon" },
                  styles: { fontSize: "48px", fontWeight: 700, color: "#171C5A", marginBottom: "24px" }
                },
                {
                  id: crypto.randomUUID(),
                  type: "paragraph",
                  props: { text: "Join the most ambitious developers for 48 hours of building." },
                  styles: { fontSize: "20px", color: "#64748B", marginBottom: "32px" }
                },
                {
                  id: crypto.randomUUID(),
                  type: "button",
                  props: { text: "Learn More", className: "px-8 py-4 font-bold text-white rounded-xl" },
                  styles: { background: "#2B0A5A" }
                }
              ]
            },
            {
              id: crypto.randomUUID(),
              type: "image",
              props: { src: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800", className: "rounded-3xl shadow-xl w-full" }
            }
          ]
        }
      ],
    },
  ],
};
