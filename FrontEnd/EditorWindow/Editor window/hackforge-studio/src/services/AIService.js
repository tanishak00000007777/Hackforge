import * as coreFactory from "@/builder/factories/coreFactory";
import { catalogueMetadata } from "@/builder/registry/catalogue";

// Simulates an API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateSection(prompt) {
  await delay(1500);

  const lowerPrompt = prompt.toLowerCase();
  const normalizedPrompt = lowerPrompt.replace(/([a-z])\1+/g, '$1');
  
  let bestMatch = null;
  let maxScore = 0;

  for (const [key, meta] of Object.entries(catalogueMetadata)) {
    let score = 0;
    
    // Normal match
    if (lowerPrompt.includes(key)) score += 10;
    
    // Typo-tolerant match (removes double letters, e.g., buutton -> buton)
    const normalizedKey = key.replace(/([a-z])\1+/g, '$1');
    if (normalizedPrompt.includes(normalizedKey)) score += 8;

    if (meta.tags) {
      meta.tags.forEach(tag => {
        if (lowerPrompt.includes(tag)) score += 3;
        const normalizedTag = tag.replace(/([a-z])\1+/g, '$1');
        if (normalizedPrompt.includes(normalizedTag)) score += 2;
      });
    }
    
    // If user mentions an element and a section (e.g., "button on hero"), they usually want to insert the element
    if (meta.category !== "Sections" && score > 0) {
      score += 1;
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = key;
    }
  }
  
  if (!bestMatch || maxScore === 0) {
    throw new Error("Could not understand which component you want.");
  }
  
  const meta = catalogueMetadata[bestMatch];
  const node = meta?.category === "Sections" 
    ? coreFactory.createComponent(bestMatch)
    : coreFactory.createElement(bestMatch);
  
  if (!node) {
    throw new Error("Could not generate a component for this prompt.");
  }

  // Inject some AI magic into the props based on keywords
  // A real LLM would hydrate the entire JSON tree
  const updateTextNode = (n, newText) => {
    if (n.type === "heading" || n.type === "paragraph") {
      if (n.props) n.props.text = newText;
    }
  };

  if (bestMatch === "image") {
    const encodedPrompt = encodeURIComponent(prompt + " high quality photography clean");
    if (!node.props) node.props = {};
    node.props.src = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true`;
    node.props.alt = prompt;
  }

  if (bestMatch === "hero" && node.children?.length > 0) {
    // Assuming the hero has a heading as the first child or nested
    if (lowerPrompt.includes("startup")) {
      const heading = node.children.find(c => c.type === "heading");
      if (heading) updateTextNode(heading, "Launch Your Next Big Startup");
      
      const paragraph = node.children.find(c => c.type === "paragraph");
      if (paragraph) updateTextNode(paragraph, "We provide the tools you need to scale fast and secure funding.");
    }
  }

  return node;
}

export async function improveText(text) {
  await delay(800);
  
  if (!text || text.length < 3) return text;
  
  const variations = [
    `Transform your experience with ${text.toLowerCase()}`,
    `${text} - Built for the modern web.`,
    `Discover the power of ${text.toLowerCase()} today.`,
    `Elevate your workflow: ${text}`,
    `${text} designed for scale.`
  ];
  
  return variations[Math.floor(Math.random() * variations.length)];
}

export async function auditProject(components, globalTheme) {
  await delay(2000);
  
  const issues = [];
  
  let h1Count = 0;
  let imageCount = 0;
  let imageWithoutAlt = 0;
  let emptyButtons = 0;

  // Simple recursive tree walker
  const walk = (node) => {
    if (node.type === "heading" && node.props?.level === "h1") h1Count++;
    if (node.type === "image") {
      imageCount++;
      if (!node.props?.alt) imageWithoutAlt++;
    }
    if (node.type === "button") {
      if (!node.props?.text || node.props.text.trim() === "") emptyButtons++;
    }
    
    if (node.children) {
      node.children.forEach(walk);
    }
  };
  
  components.forEach(walk);
  
  // SEO Rules
  if (h1Count === 0) {
    issues.push({ type: "SEO", severity: "high", message: "Your page is missing an H1 heading. Search engines use this to understand your page content." });
  } else if (h1Count > 1) {
    issues.push({ type: "SEO", severity: "medium", message: "You have multiple H1 headings. It is recommended to have exactly one H1 per page." });
  }
  
  if (imageWithoutAlt > 0) {
    issues.push({ type: "Accessibility", severity: "high", message: `${imageWithoutAlt} image(s) are missing 'alt' text, which is required for screen readers.` });
  }
  
  // UX Rules
  if (emptyButtons > 0) {
    issues.push({ type: "UX", severity: "medium", message: `Found ${emptyButtons} button(s) with no text. Users will not know what they do.` });
  }

  if (components.length === 0) {
    issues.push({ type: "UX", severity: "low", message: "Your canvas is empty! Try asking the AI Copilot to generate a section." });
  }

  return issues;
}
