// ===========================================
// Project Exporter Utility
// Generates a ZIP file containing a full React/Vite project
// ===========================================

import JSZip from "jszip";
import FileSaver from "file-saver";
import { generateJSX, generateCSS, generateHTML } from "./CodeGenerator";

// file-saver is CommonJS; the named import only resolves under a bundler.
const { saveAs } = FileSaver;

/** "/" -> index.html, "/about-us" -> about-us.html */
export const fileNameForPath = (path) => (!path || path === "/" ? "index.html" : `${path.replace(/^\//, "")}.html`);

/**
 * Static HTML/CSS build, one file per page plus a shared stylesheet. This is
 * what "publish" hands over, and it is also the shape the PersonaForge AI
 * editing backend accepts for upload.
 *
 * Accepts a page array, or a bare component array for a single-page site.
 */
export function buildStaticSite(pagesOrComponents, globalTheme, { title = "HackForge Site" } = {}) {
  const pages = Array.isArray(pagesOrComponents) && pagesOrComponents[0]?.path !== undefined
    ? pagesOrComponents
    : [{ name: title, path: "/", components: pagesOrComponents }];

  const nav = pages.map((page) => ({ label: page.name, href: fileNameForPath(page.path) }));

  const files = { "styles.css": generateCSS(globalTheme) };
  for (const page of pages) {
    files[fileNameForPath(page.path)] = generateHTML(page.components || [], globalTheme, {
      title: pages.length > 1 ? `${page.name} — ${title}` : title,
      // Cross-page links only make sense once there is more than one page.
      nav: pages.length > 1 ? nav : null,
      currentHref: fileNameForPath(page.path),
    });
  }
  return files;
}

export async function exportStaticSite(pagesOrComponents, globalTheme, options = {}) {
  const zip = new JSZip();
  for (const [name, contents] of Object.entries(buildStaticSite(pagesOrComponents, globalTheme, options))) {
    zip.file(name, contents);
  }
  saveAs(await zip.generateAsync({ type: "blob" }), "hackforge-site.zip");
}

export async function exportReactProject(components, globalTheme) {
  const zip = new JSZip();

  // 1. Generate core code
  const appJsx = generateJSX(components);
  const indexCss = generateCSS(globalTheme);

  // 2. Add to src/ folder
  const srcFolder = zip.folder("src");
  srcFolder.file("App.jsx", appJsx);
  srcFolder.file("index.css", indexCss);
  
  const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
  srcFolder.file("main.jsx", mainJsx);

  // 3. Add configuration files
  const packageJson = {
    name: "hackforge-generated-app",
    private: true,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview"
    },
    dependencies: {
      "react": "^19.0.0",
      "react-dom": "^19.0.0"
    },
    devDependencies: {
      "@vitejs/plugin-react": "^4.2.1",
      "vite": "^5.2.0"
    }
  };
  zip.file("package.json", JSON.stringify(packageJson, null, 2));

  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
`;
  zip.file("vite.config.js", viteConfig);

  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
  zip.file("index.html", indexHtml);

  // Generate ZIP and trigger download
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "hackforge-react-app.zip");
}
