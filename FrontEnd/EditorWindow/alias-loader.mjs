// Lets `node --import ./alias-loader.mjs foo.test.mjs` load modules written for
// vite: the "@/" alias from vite.config.js, extensionless relative imports, and
// .jsx files (transformed with the esbuild vite already ships).
// Only module loading is patched; nothing is stubbed or mocked.
import { register } from "node:module";

register("./loader-hooks.mjs", import.meta.url);
