// Run: npm test   (node --import ./alias-loader.mjs run-tests.mjs)
// Discovers and runs every *.test.mjs under src/.
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const found = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (entry.endsWith(".test.mjs")) found.push(full);
  }
})("src");

let failed = 0;
for (const file of found.sort()) {
  try {
    await import(pathToFileURL(file).href);
  } catch (err) {
    failed++;
    console.error(`FAIL ${file}\n  ${String(err.message).split("\n")[0]}`);
  }
}

console.log(`\n${found.length - failed}/${found.length} suites passed`);
process.exit(failed ? 1 : 0);
