// ===========================================
// Project Exporter Utility
// Generates a ZIP file containing a full React/Vite project
// ===========================================

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { generateJSX, generateCSS } from "./CodeGenerator";

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
