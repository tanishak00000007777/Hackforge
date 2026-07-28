// Run: node src/services/ai/personaForgeClient.test.mjs
import assert from "node:assert/strict";
import { pollJob, personaForge } from "./personaForgeClient.js";

const done = (fn) => new Promise((resolve) => fn(resolve));

// stops on a terminal state, having reported every update
await done(async (resolve) => {
  const states = ["queued", "running", "needs_review", "approved"];
  let calls = 0;
  const seen = [];
  pollJob(
    "j1",
    (job) => {
      seen.push(job.state);
      if (job.state === "needs_review") {
        setTimeout(() => {
          assert.equal(calls, 3, "polling must stop at needs_review");
          assert.deepEqual(seen, ["queued", "running", "needs_review"]);
          resolve();
        }, 30);
      }
    },
    { intervalMs: 1, getJob: async () => ({ state: states[calls++] }) },
  );
});

// surfaces fetch errors and stops
await done((resolve) => {
  pollJob("j2", (job, err) => {
    assert.equal(job, null);
    assert.match(err.message, /boom/);
    resolve();
  }, { intervalMs: 1, getJob: async () => { throw new Error("boom"); } });
});

// times out instead of polling forever
await done((resolve) => {
  pollJob("j3", (job, err) => {
    if (err) {
      assert.match(err.message, /Timed out/);
      resolve();
    }
  }, { intervalMs: 1, timeoutMs: 0, getJob: async () => ({ state: "running" }) });
});

// cancel() stops further polling
await done((resolve) => {
  let calls = 0;
  const cancel = pollJob("j4", () => cancel(), {
    intervalMs: 1,
    getJob: async () => { calls++; return { state: "running" }; },
  });
  setTimeout(() => {
    assert.equal(calls, 1, "no polls after cancel");
    resolve();
  }, 40);
});

// download url only carries ?version when asked
assert.ok(personaForge.downloadUrl("p1").endsWith("/api/projects/p1/download"));
assert.ok(personaForge.downloadUrl("p1", 3).endsWith("download?version=3"));

console.log("personaForgeClient: all checks passed");
