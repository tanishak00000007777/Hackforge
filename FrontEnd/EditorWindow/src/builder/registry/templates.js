import { createComponent } from "../factories/coreFactory";
import { defaultTheme } from "../styles/theme";

/* These sections must NOT be built while this module is being imported.
 *
 * createComponent() reads componentRegistry from builder/registry/index.js. In
 * the production bundle this file gets evaluated before that module has
 * initialised, so componentRegistry is still undefined and the lookup threw
 * "Cannot read properties of undefined (reading 'hero')" -- which killed the
 * whole studio chunk and left the editor a blank screen. Dev never showed it
 * because Vite serves modules unbundled, in import order.
 *
 * Building on first access instead keeps the registry lookup out of module
 * evaluation entirely. Memoised, so each template's data stays one stable
 * object across reads, exactly as it was when built eagerly. */
function lazySection(type) {
  let built;
  let ready = false;
  return () => {
    if (!ready) {
      built = createComponent(type);
      ready = true;
    }
    return built;
  };
}

const heroSection = lazySection("hero");
const aboutSection = lazySection("about");
const tracksSection = lazySection("tracks");
const faqSection = lazySection("faq");
const footerSection = lazySection("footer");

/** Built-in templates plus whatever the user saved. The built-ins are static,
 *  so they are never kept in the store or persisted -- see editorStore. */
export function listTemplates(userTemplates = []) {
  return [...defaultTemplates, ...userTemplates];
}

export const defaultTemplates = [
  {
    id: "tpl_hero_1",
    name: "Modern Hero Section",
    type: "section",
    category: "hero",
    get data() { return heroSection(); }
  },
  {
    id: "tpl_about_1",
    name: "Standard About Us",
    type: "section",
    category: "about",
    get data() { return aboutSection(); }
  },
  {
    id: "tpl_tracks_1",
    name: "Event Tracks",
    type: "section",
    category: "features",
    get data() { return tracksSection(); }
  },
  {
    id: "tpl_page_1",
    name: "Hackathon Landing Page",
    type: "page",
    category: "landing",
    get data() {
      return {
        components: [heroSection(), aboutSection(), tracksSection(), faqSection(), footerSection()].filter(Boolean),
        globalTheme: defaultTheme
      };
    }
  },
  {
    id: "tpl_website_1",
    name: "Dark Mode Tech Event",
    type: "website",
    category: "tech",
    get data() {
      return {
        components: [heroSection(), tracksSection(), faqSection(), footerSection()].filter(Boolean),
        globalTheme: {
          ...defaultTheme,
          colors: {
            ...defaultTheme.colors,
            background: "#0f172a",
            foreground: "#f8fafc",
            primary: "#8b5cf6",
          }
        }
      };
    }
  }
];
