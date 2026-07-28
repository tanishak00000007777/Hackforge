// Run: node src/services/ai/tools/defineTool.test.mjs
import assert from "node:assert/strict";
import { defineTool, ok, fail, summarizeNode } from "./defineTool.js";

const build = (execute, required = []) =>
  defineTool({
    name: "t", description: "d",
    parameters: { type: "object", properties: { a: { type: "string" } }, required },
    execute,
  });

// missing required params never reach the tool body
let ran = false;
const guarded = build(() => { ran = true; return ok(); }, ["a"]);
const missing = await guarded.execute({}, null);
assert.equal(missing.success, false);
assert.match(missing.error, /Missing required parameter\(s\): a/);
assert.equal(ran, false, "body must not run with invalid args");

// null counts as missing, not as a value
assert.equal((await guarded.execute({ a: null }, null)).success, false);
assert.equal((await guarded.execute({ a: "x" }, null)).success, true);

// a thrown error becomes a structured failure, not an exception
const thrower = build(() => { throw new Error("boom"); });
const caught = await thrower.execute({}, null);
assert.deepEqual(caught, { success: false, error: "boom" });

// a tool returning a bare object still yields the contract shape
assert.deepEqual(await build(() => ({ count: 2 })).execute({}, null), { success: true, data: { count: 2 } });
// ...and an explicit envelope is passed through untouched
assert.deepEqual(await build(() => fail("nope")).execute({}, null), { success: false, error: "nope" });

// malformed definitions are rejected at construction, not at call time
assert.throws(() => defineTool({ name: "x", description: "d" }), /Invalid tool definition/);

// summarizeNode bounds the payload sent back to the model
const deep = { id: "1", type: "a", children: [{ id: "2", type: "b", children: [{ id: "3", type: "c", children: [] }] }] };
const summary = summarizeNode(deep, 1);
assert.equal(summary.children[0].id, "2");
assert.equal(summary.children[0].children, undefined, "depth limit prevents dumping whole subtrees");
assert.equal(summary.childCount, 1);

console.log("defineTool: all checks passed");
