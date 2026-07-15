import {
  LayoutGrid, Info, GitBranch, Boxes, Trophy, Users, Timer, CircleHelp,
  Type, AlignLeft, Square, Image as ImageIcon, Box, Rows, Columns,
  Grid as GridIcon, Minus, Badge, CreditCard, Video, List, Folder, CheckSquare, AlignJustify, Map, FileText
} from "lucide-react";

export const catalogueMetadata = {
  // Sections
  hero: { category: "Sections", icon: LayoutGrid, description: "Main landing area with strong call to action.", tags: ["header", "intro", "cta"] },
  about: { category: "Sections", icon: Info, description: "Information about the event.", tags: ["info", "description"] },
  timeline: { category: "Sections", icon: GitBranch, description: "Event schedule and milestones.", tags: ["schedule", "dates"] },
  tracks: { category: "Sections", icon: Boxes, description: "Different competition tracks.", tags: ["categories", "topics"] },
  sponsors: { category: "Sections", icon: Trophy, description: "Sponsors and partners.", tags: ["partners", "logos"] },
  judges: { category: "Sections", icon: Users, description: "Event judges and speakers.", tags: ["people", "team"] },
  faq: { category: "Sections", icon: CircleHelp, description: "Frequently asked questions.", tags: ["questions", "answers"] },
  footer: { category: "Sections", icon: Box, description: "Page footer with links.", tags: ["bottom", "links"] },
  formEmbed: { category: "Sections", icon: FileText, description: "Embed a published HackForge form.", tags: ["form", "quiz", "submission"] },

  // Elements (Typography)
  heading: { category: "Typography", icon: Type, description: "Large title text.", tags: ["text", "title", "h1"] },
  paragraph: { category: "Typography", icon: AlignLeft, description: "Standard body text.", tags: ["text", "body", "p"] },
  button: { category: "Typography", icon: Square, description: "Clickable button.", tags: ["click", "link", "cta"] },
  badge: { category: "Typography", icon: Badge, description: "Small highlighted text pill.", tags: ["pill", "tag", "label"] },

  // Elements (Media)
  image: { category: "Media", icon: ImageIcon, description: "Image from URL.", tags: ["picture", "photo", "img"] },
  video: { category: "Media", icon: Video, description: "Video player.", tags: ["player", "embed", "youtube"] },

  // Elements (Layout)
  container: { category: "Layout", icon: Box, description: "Basic wrapper container.", tags: ["div", "wrapper", "box"] },
  row: { category: "Layout", icon: Rows, description: "Horizontal flex row.", tags: ["flex", "horizontal"] },
  column: { category: "Layout", icon: Columns, description: "Vertical flex column.", tags: ["flex", "vertical"] },
  grid: { category: "Layout", icon: GridIcon, description: "CSS grid layout.", tags: ["grid", "columns"] },
  divider: { category: "Layout", icon: Minus, description: "Horizontal line separator.", tags: ["hr", "line"] },

  // Elements (Components)
  card: { category: "Components", icon: CreditCard, description: "Stylized container with shadow.", tags: ["box", "panel"] },
  countdown: { category: "Components", icon: Timer, description: "Live countdown timer.", tags: ["timer", "clock", "date"] },
  accordion: { category: "Components", icon: List, description: "Collapsible content panels.", tags: ["collapse", "expand", "faq"] },
  tabs: { category: "Components", icon: Folder, description: "Tabbed content area.", tags: ["tabs", "navigation"] },

  // Elements (Forms)
  input: { category: "Forms", icon: CheckSquare, description: "Text input field.", tags: ["form", "text", "field"] },
  textarea: { category: "Forms", icon: AlignJustify, description: "Multiline text area.", tags: ["form", "text", "multiline"] },
  
  // Elements (Other)
  map: { category: "Other", icon: Map, description: "Embedded Google map.", tags: ["location", "embed", "google"] }
};
