import { createComponent } from "../factories/coreFactory";
import { defaultTheme } from "../styles/theme";

// Generate initial components for templates
const heroSection = createComponent("hero");
const aboutSection = createComponent("about");
const tracksSection = createComponent("tracks");
const faqSection = createComponent("faq");
const footerSection = createComponent("footer");

export const defaultTemplates = [
  {
    id: "tpl_hero_1",
    name: "Modern Hero Section",
    type: "section",
    category: "hero",
    data: heroSection
  },
  {
    id: "tpl_about_1",
    name: "Standard About Us",
    type: "section",
    category: "about",
    data: aboutSection
  },
  {
    id: "tpl_tracks_1",
    name: "Event Tracks",
    type: "section",
    category: "features",
    data: tracksSection
  },
  {
    id: "tpl_page_1",
    name: "Hackathon Landing Page",
    type: "page",
    category: "landing",
    data: {
      components: [heroSection, aboutSection, tracksSection, faqSection, footerSection].filter(Boolean),
      globalTheme: defaultTheme
    }
  },
  {
    id: "tpl_website_1",
    name: "Dark Mode Tech Event",
    type: "website",
    category: "tech",
    data: {
      components: [heroSection, tracksSection, faqSection, footerSection].filter(Boolean),
      globalTheme: {
        ...defaultTheme,
        colors: {
          ...defaultTheme.colors,
          background: "#0f172a",
          foreground: "#f8fafc",
          primary: "#8b5cf6",
        }
      }
    }
  }
];
