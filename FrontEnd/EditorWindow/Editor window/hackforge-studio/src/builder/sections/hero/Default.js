export default {
  type: "hero",
  props: {
    background: "#FFFFFF",
    paddingTop: 112,
    paddingBottom: 112,
  },
  children: [
    {
      id: crypto.randomUUID(),
      type: "container",
      props: { className: "text-center px-6 relative z-10" },
      children: [
        {
          id: crypto.randomUUID(),
          type: "badge",
          props: {
            text: "WEB3 CHALLENGE 2024",
            background: "#EDE9FE",
            color: "#6D28D9",
            className: "mb-8",
          },
        },
        {
          id: crypto.randomUUID(),
          type: "heading",
          props: {
            text: "Build the Decentralized Future.",
          },
          styles: {
            fontSize: "72px",
            fontWeight: 900,
            color: "#171C5A",
            lineHeight: "78px",
            letterSpacing: "-2px",
            fontFamily: "Inter",
          },
        },
        {
          id: crypto.randomUUID(),
          type: "paragraph",
          props: {
            text: "Join 500+ developers for a 48-hour sprint to solve global problems using blockchain technology.",
            className: "mt-8 mx-auto max-w-2xl",
          },
          styles: {
            fontSize: "28px",
            color: "#64748B",
            fontFamily: "Inter",
          },
        },
        {
          id: crypto.randomUUID(),
          type: "row",
          props: {
            justifyContent: "center",
            gap: 16,
            className: "mt-12",
          },
          children: [
            {
              id: crypto.randomUUID(),
              type: "button",
              props: {
                text: "Register Now",
                className: "px-8 py-4 text-white font-bold hover:scale-105 transition-all duration-200 rounded-xl",
              },
              styles: {
                background: "#2B0A5A",
                fontSize: "20px",
              },
            },
            {
              id: crypto.randomUUID(),
              type: "button",
              props: {
                text: "View Prize Pool",
                className: "px-8 py-4 font-bold hover:bg-slate-50 transition-all duration-200 rounded-xl border-2",
              },
              styles: {
                borderColor: "#2D0B59",
                color: "#2D0B59",
                fontSize: "20px",
              },
            },
          ],
        },
      ],
    },
  ],
};
