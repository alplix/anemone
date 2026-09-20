// Client of the optional accounts service (worker/). Everything here is opt-in: with no API configured the app is
// purely local. The password never leaves the device: a 256-bit key is derived in the browser with PBKDF2
// (200,000 rounds, SHA-256) and only that key (and a hash of it on the server) is ever sent.
import { base } from "./i18n.js";
import * as store from "./store.js";

const AUTH = "anemone.auth";
export const apiBase = () => (document.body.dataset.api || "").replace(/\/$/, "");
export const enabled = () => !!apiBase();

export function getAuth() { try { return JSON.parse(localStorage.getItem(AUTH) || "null"); } catch { return null; } }
export function setAuth(a) { try { if (a) localStorage.setItem(AUTH, JSON.stringify(a)); else localStorage.removeItem(AUTH); } catch { /* memory only */ } }

export async function call(method, path, body, opts = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const a = getAuth();
  if (opts.auth !== false && a) headers.Authorization = "Bearer " + a.key;
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), opts.timeout || 15000);
  try {
    const r = await fetch(apiBase() + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal: ctl.signal, keepalive: !!opts.keepalive });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || "http_" + r.status), { code: j.error || "http_" + r.status, status: r.status });
    return j;
  } catch (e) {
    if (e.name === "AbortError") throw Object.assign(new Error("timeout"), { code: "timeout" });
    if (!e.code) throw Object.assign(new Error("network"), { code: "network" });
    throw e;
  } finally { clearTimeout(tm); }
}

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

/** Same normalisation as the server's username uniqueness (accent-fold, lower-case, letters and digits only). */
export async function normUser(username) {
  const m = await import("./moderation.js");
  return m.normalise(username).squashed;
}

export async function deriveKey(secret, purpose, username) {
  const enc = new TextEncoder();
  const salt = enc.encode(`anemone:${purpose}:v1:${await normUser(username)}`);
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 200000 }, key, 256));
}

const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function newRecoveryCode() {
  const a = new Uint8Array(20); crypto.getRandomValues(a);
  const c = [...a].map((n) => ALPHA[n % ALPHA.length]).join("");
  return c.match(/.{4}/g).join("-");
}
export const cleanRecovery = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, "").match(/.{1,4}/g)?.join("-") || "";

// ---------------------------------------------------------------------------
// summary numbers + cloud save
// ---------------------------------------------------------------------------
export function summary(courseOfLesson) {
  const s = store.get();
  let answers = 0, right = 0;
  const byCourse = {};
  for (const [key, q] of Object.entries(s.q)) {
    answers += q.r + q.w; right += q.r;
    const course = courseOfLesson?.[key.split("/")[0]];
    if (course) { const c = (byCourse[course] ||= { xp: 0, answers: 0, right: 0, studySec: 0 }); c.answers += q.r + q.w; c.right += q.r; }
  }
  const studySec = Object.values(s.time.days).reduce((a, d) => a + d.study, 0);
  for (const [course, xp] of Object.entries(s.xpc || {})) { const c = (byCourse[course] ||= { xp: 0, answers: 0, right: 0, studySec: 0 }); c.xp = xp; }
  const lv = Math.floor((1 + Math.sqrt(1 + (8 * s.xp) / 100)) / 2);
  return {
    xp: Math.round(s.xp), level: Math.max(1, lv), answers, right, studySec: Math.round(studySec), streak: store.streakNow(), bestStreak: s.streak.best,
    lessonsDone: Object.values(s.progress.lessons).filter((l) => l.done).length, badges: Object.keys(s.badges).length, courses: byCourse,
  };
}

let lastPush = 0;
export async function pushNow(courseOfLesson, opts = {}) {
  if (!enabled() || !getAuth()) return { skipped: true };
  const now = Date.now();
  if (!opts.force && now - lastPush < 180000) return { skipped: true };
  lastPush = now;
  await call("PUT", "/api/sync", summary(courseOfLesson), { keepalive: opts.keepalive });
  const text = store.exportSave();
  if (text.length < 380000) await call("PUT", "/api/save", { state: text }, { keepalive: opts.keepalive && text.length < 60000 });
  return { ok: true };
}

/** After signing in: merge the cloud save into the device (merge keeps the newer/larger entries, so nothing is lost). */
export async function pullAndMerge() {
  const r = await call("GET", "/api/save");
  if (r.state) { const res = store.importSave(r.state, "merge"); return { pulled: true, ok: res.ok }; }
  return { pulled: false };
}
