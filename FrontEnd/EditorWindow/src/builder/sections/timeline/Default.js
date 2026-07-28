export default {
  type: "timeline",
  props: {
    background: "#FFFFFF",
    paddingTop: 96,
    paddingBottom: 96,
  },
  children: [
    {
      id: crypto.randomUUID(),
      type: "container",
      props: { className: "max-w-4xl mx-auto px-6" },
      children: [
        {
          id: crypto.randomUUID(),
          type: "heading",
          props: {
            text: "Event Schedule",
          },
          styles: {
            fontSize: "48px",
            fontWeight: 700,
            color: "#171C5A",
            fontFamily: "Inter",
            textAlign: "center",
            marginBottom: "64px"
          },
        },
        {
          id: crypto.randomUUID(),
          type: "column",
          props: { gap: 32 },
          children: [
            {
              id: crypto.randomUUID(),
              type: "card",
              props: { background: "#F8FAFC", padding: 24, className: "border-l-4 border-violet-600" },
              children: [
                {
                  id: crypto.randomUUID(),
                  type: "badge",
                  props: { text: "Day 1 - 9:00 AM", background: "#EDE9FE", color: "#6D28D9", className: "mb-4" }
                },
                {
                  id: crypto.randomUUID(),
                  type: "heading",
                  props: { text: "Registration & Breakfast" },
                  styles: { fontSize: "20px", fontWeight: "bold", color: "#171C5A", marginBottom: "8px" }
                },
                {
                  id: crypto.randomUUID(),
                  type: "paragraph",
                  props: { text: "Check in, grab your swag, and get ready for an amazing weekend." },
                  styles: { color: "#64748B" }
                }
              ]
            }
          ]
        }
      ],
    },
  ],
};
