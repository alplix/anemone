// node worker/smoke-test.mjs <workerUrl> <siteOrigin>
// End-to-end check of a deployed (or `wrangler dev`) worker. Creates a throw-away user and DELETES it at the end.
import crypto from "node:crypto";

const [api, origin] = process.argv.slice(2);
if (!api || !origin) { console.error("usage: node worker/smoke-test.mjs <workerUrl> <siteOrigin>"); process.exit(2); }
let failed = 0;
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"} ${m}`); if (!c) failed++; };
const hex = () => crypto.randomBytes(32).toString("hex");
async function call(method, path, body, key, extraHeaders = {}) {
  const r = await fetch(api + path, { method, headers: { Origin: origin, ...(body ? { "Content-Type": "application/json" } : {}), ...(key ? { Authorization: "Bearer " + key } : {}), ...extraHeaders }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => ({})) };
}

const name = "smoke" + crypto.randomBytes(4).toString("hex");
const key = hex(), recoveryKey = hex(), newKey = hex();

ok((await call("GET", "/api/health")).status === 200, "health");
ok((await fetch(api + "/api/health", { headers: { Origin: "https://evil.example" } })).status === 403, "foreign origin is refused");
ok((await call("POST", "/api/register", { username: "x", key, recoveryKey })).status === 400, "bad username rejected");
// offensive usernames are refused (a word taken from the shipped LDNOOBW list, so the test cannot drift)
import fs from "node:fs";
const lists = JSON.parse(fs.readFileSync(new URL("./src/wordlists.json", import.meta.url))).lists;
const bad = lists.en.find((w) => /^[a-z]{6,8}$/.test(w));
ok((await call("POST", "/api/register", { username: bad, key: hex(), recoveryKey: hex() })).json.error === "username_not_allowed", "offensive username is refused by the server");
let r = await call("POST", "/api/register", { username: name, key, recoveryKey });
ok(r.status === 201, "register");
ok((await call("POST", "/api/register", { username: name, key: hex(), recoveryKey: hex() })).status === 409, "duplicate username rejected");
r = await call("GET", "/api/me", null, key);
ok(r.status === 200 && r.json.username === name && r.json.optin === false, "me (opt-in defaults to false)");
ok((await call("GET", "/api/me", null, hex())).status === 401, "wrong key rejected");

r = await call("PUT", "/api/profile", { profile: { first_name: "Test", about: "hello", age_range: "under18" }, vis: { first_name: true, about: true, country: true } }, key);
ok(r.status === 200 && r.json.vis.first_name === false && r.json.vis.about === false, "under-18: name and about can never be public");
r = await call("PUT", "/api/profile", { profile: { about: "totally fine text", age_range: "25-34" }, vis: { about: true } }, key);
ok(r.status === 200 && r.json.vis.about === true, "adult profile field can be made public");

ok((await call("PUT", "/api/sync", { xp: 1e12, level: 2, answers: 20, right: 15, studySec: 300, streak: 2, bestStreak: 2, lessonsDone: 1, badges: 2 }, key)).status === 400, "absurd numbers rejected");
r = await call("PUT", "/api/sync", { xp: 120, level: 2, answers: 20, right: 15, studySec: 300, streak: 2, bestStreak: 2, lessonsDone: 1, badges: 2, courses: { "mass-communication-theories": { xp: 120, answers: 20, right: 15, studySec: 300 } } }, key);
ok(r.status === 200, "sync");
r = await call("PUT", "/api/save", { state: JSON.stringify({ format: "anemone-save", state: { xp: 120 } }) }, key);
ok(r.status === 200, "cloud save");
r = await call("GET", "/api/save", null, key);
ok(r.status === 200 && r.json.state && JSON.parse(r.json.state).format === "anemone-save", "cloud save round-trip");

ok((await call("GET", "/api/profile/" + name)).status === 404, "profile hidden until opt-in");
ok((await call("PUT", "/api/optin", { optin: true }, key)).status === 200, "opt in");
r = await call("GET", "/api/profile/" + name);
ok(r.status === 200 && r.json.profile.about && !r.json.profile.first_name, "public profile shows only public fields");
r = await call("GET", "/api/leaderboard?scope=global&metric=xp");
ok(r.status === 200 && Array.isArray(r.json.rows), "leaderboard");

r = await call("POST", "/api/groups", { name: "Smoke group" }, key);
ok(r.status === 201 && r.json.code, "create group");
const gid = r.json.id;
r = await call("GET", `/api/groups/${gid}/board`, null, key);
ok(r.status === 200 && r.json.rows.length === 1, "group board");
ok((await call("POST", "/api/report", { kind: "username", target: name, reason: "smoke test" }, key)).status === 201, "report");
ok((await call("GET", "/api/admin/reports")).status === 401, "admin endpoints need the token");

r = await call("POST", "/api/recover", { username: name, recoveryKey, newKey });
ok(r.status === 200, "recover with the recovery key");
ok((await call("GET", "/api/me", null, key)).status === 401, "old key no longer works");
ok((await call("GET", "/api/me", null, newKey)).status === 200, "new key works");
r = await call("GET", "/api/export", null, newKey);
ok(r.status === 200 && r.json.username === name, "export");
ok((await call("DELETE", "/api/account", null, newKey)).status === 200, "delete account (cleanup)");
ok((await call("GET", "/api/me", null, newKey)).status === 401, "account is gone");

console.log(failed ? `${failed} check(s) failed` : "smoke test passed");
process.exit(failed ? 1 : 0);
