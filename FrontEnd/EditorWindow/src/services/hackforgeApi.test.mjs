import assert from "node:assert/strict";
import { getManagedHackathon, normalizeApiBase } from "./hackforgeApi.js";

assert.equal(normalizeApiBase("https://api.example.com/api/v1/"), "https://api.example.com/api/v1");
assert.equal(normalizeApiBase("/api/v1///"), "/api/v1");
assert.equal(normalizeApiBase(""), "/api/v1");

const originalFetch = globalThis.fetch;
const calls = [];
globalThis.fetch = async (url) => {
  calls.push(url);
  return {
    ok: true,
    status: 200,
    json: async () => [{ id: "event-1", title: "Owned event" }],
  };
};
const event = await getManagedHackathon({
  apiBaseUrl: "/api/v1",
  accessToken: "test-token",
  hackathonId: "event-1",
});
assert.equal(event.title, "Owned event");
assert.equal(calls[0], "/api/v1/hackathons/mine/owned");
globalThis.fetch = originalFetch;

console.log("hackforgeApi: all checks passed");
