// Module resolution/loading hooks used by alias-loader.mjs.
// Kept as a real file (not a data: URL) so bare imports like "esbuild"
// resolve against the project's node_modules.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transformSync } from "esbuild";

const SRC = new URL("./src/", import.meta.url).href;
const EXTENSIONS = [".js", ".jsx", ".mjs", "/index.js", "/index.jsx"];

export async function resolve(specifier, context, next) {
  // Vite's `?raw` suffix: resolve the file itself and let load() inline it.
  if (specifier.endsWith("?raw")) {
    const bare = specifier.slice(0, -4);
    const base = bare.startsWith("@/") ? SRC + bare.slice(2) : bare;
    const href = /^[a-z]+:/i.test(base) ? base : new URL(base, context.parentURL).href;
    return { url: href + "?raw", format: "module", shortCircuit: true };
  }

  const target = specifier.startsWith("@/") ? SRC + specifier.slice(2) : specifier;

  // vite fills in the extension; node requires it.
  const relative = target.startsWith("./") || target.startsWith("../");
  if ((relative || target.startsWith(SRC)) && !/\.[a-z]+$/i.test(target)) {
    const base = target.startsWith(SRC) ? target : new URL(target, context.parentURL).href;
    for (const ext of EXTENSIONS) {
      if (existsSync(fileURLToPath(base + ext))) return next(base + ext, context);
    }
  }
  return next(target, context);
}

export async function load(url, context, next) {
  if (url.endsWith("?raw")) {
    const source = readFileSync(fileURLToPath(url.slice(0, -4)), "utf8");
    return {
      format: "module",
      source: `export default ${JSON.stringify(source)};`,
      shortCircuit: true,
    };
  }
  if (url.endsWith(".jsx")) {
    const source = readFileSync(fileURLToPath(url), "utf8");
    const { code } = transformSync(source, { loader: "jsx", format: "esm", jsx: "automatic" });
    return { format: "module", source: code, shortCircuit: true };
  }
  return next(url, context);
}
