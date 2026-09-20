// Local-first persistence. Everything is saved to localStorage the moment it changes (debounced by a few
// hundred ms and flushed when the tab is hidden). The save file is plain JSON and is sanitised on import.
import { todayStr } from "./dom.js";

const KEY = "anemone.state";
const SKEY = "anemone.settings";
export const FORMAT = "anemone-save";

export const DEFAULT_SETTINGS = {
  theme: "console", fs: "1", lh: "1.6", dyslexia: false, motion: "auto", reading: "cards",
  goalMin: 15, tip: "off", tipSeen: "", skipDeep: false,
};

const fresh = () => ({
  v: 1, created: Date.now(), progress: { lessons: {} }, xp: 0, badges: {}, q: {}, leitner: {}, mistakes: {},
  time: { days: {}, hours: new Array(24).fill(0) }, streak: { current: 0, best: 0, last: "" }, exams: [],
  last: null, counters: { cards: 0, questions: 0, right: 0, deep: 0, panels: 0, reviews: 0 }, goalDays: {}, xpc: {},
});

let state = fresh();
let settings = { ...DEFAULT_SETTINGS };
let memoryOnly = false;
const listeners = new Set();
let timer = null;
let dirty = false;

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const QKEY = /^[a-z0-9][a-z0-9-]{0,63}\/[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

function readKey(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function writeKey(key, obj) {
  try { localStorage.setItem(key, JSON.stringify(obj)); return true; } catch { memoryOnly = true; return false; }
}

export function load() {
  const s = readKey(KEY);
  state = s ? sanitizeState(s) : fresh();
  const st = readKey(SKEY);
  settings = { ...DEFAULT_SETTINGS, ...sanitizeSettings(st || {}) };
  return state;
}

export const get = () => state;
export const getSettings = () => settings;
export const isMemoryOnly = () => memoryOnly;

export function on(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit(what) { for (const fn of listeners) { try { fn(what); } catch (e) { console.error(e); } } }

/** Mark the state changed: saved right away in memory, written to localStorage shortly after. */
export function touch(quiet) {
  dirty = true;
  clearTimeout(timer);
  timer = setTimeout(flush, 250);
  if (!quiet) emit("state");
}
export function flush() {
  clearTimeout(timer);
  if (!dirty) return;
  dirty = false;
  writeKey(KEY, state);
}

export function setSetting(key, value) {
  settings[key] = value;
  writeKey(SKEY, settings);
  emit("settings");
}

export function reset() {
  state = fresh();
  dirty = false;
  clearTimeout(timer);
  writeKey(KEY, state);
  emit("state");
}

// -------- lesson progress helpers -----------------------------------------
export function lessonState(id) {
  const l = state.progress.lessons;
  if (!l[id]) l[id] = { seen: {}, ans: {}, pos: 0, started: 0, done: 0, quiz: { best: 0, attempts: 0, last: 0 }, deep: {} };
  return l[id];
}
export const isDone = (id) => !!state.progress.lessons[id]?.done;

export function streakTouch(dateStr = todayStr()) {
  const s = state.streak;
  if (s.last === dateStr) return false;
  const y = new Date(); y.setDate(y.getDate() - 1);
  s.current = s.last === todayStr(y) ? s.current + 1 : 1;
  s.last = dateStr;
  s.best = Math.max(s.best, s.current);
  return true;
}
/** Streak as shown today (a broken streak reads 0 until the user studies again). */
export function streakNow() {
  const s = state.streak;
  const t0 = todayStr(); const y = new Date(); y.setDate(y.getDate() - 1);
  if (s.last === t0 || s.last === todayStr(y)) return s.current;
  return 0;
}

// -------- export / import --------------------------------------------------
export function exportSave() {
  flush();
  return JSON.stringify({ format: FORMAT, version: 1, exported: new Date().toISOString(), settings, state }, null, 1);
}

const num = (v, lo, hi, d = 0) => (typeof v === "number" && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const str = (v, max = 64) => (typeof v === "string" ? v.slice(0, max) : "");

export function sanitizeSettings(s) {
  const out = {};
  if (["console", "terminal", "amber", "ice", "light", "sepia", "contrast", "cvd", "paper"].includes(s.theme)) out.theme = s.theme;
  else if (s.theme === "dark" || s.theme === "auto") out.theme = "console";
  if (["0.9", "1", "1.15", "1.3", "1.5", "1.75"].includes(String(s.fs))) out.fs = String(s.fs);
  if (["1.4", "1.6", "1.8", "2"].includes(String(s.lh))) out.lh = String(s.lh);
  if (typeof s.dyslexia === "boolean") out.dyslexia = s.dyslexia;
  if (["auto", "reduce"].includes(s.motion)) out.motion = s.motion;
  if (["cards", "scroll"].includes(s.reading)) out.reading = s.reading;
  if ([5, 10, 15, 20, 30, 45, 60, 90].includes(Number(s.goalMin))) out.goalMin = Number(s.goalMin);
  if (["off", "visit", "daily", "weekly"].includes(s.tip)) out.tip = s.tip;
  if (typeof s.skipDeep === "boolean") out.skipDeep = s.skipDeep;
  out.tipSeen = str(s.tipSeen, 12);
  return out;
}

export function sanitizeState(s) {
  const out = fresh();
  if (!s || typeof s !== "object") return out;
  out.created = num(s.created, 0, 4e12, out.created);
  out.xp = num(s.xp, 0, 1e7);
  for (const [id, v] of Object.entries(s.progress?.lessons || {})) {
    if (!ID.test(id) || !v || typeof v !== "object") continue;
    const l = { seen: {}, ans: {}, pos: num(v.pos, 0, 500), started: num(v.started, 0, 4e12), done: num(v.done, 0, 4e12), quiz: { best: num(v.quiz?.best, 0, 1), attempts: num(v.quiz?.attempts, 0, 9999), last: num(v.quiz?.last, 0, 4e12) }, deep: {} };
    for (const [c, ts] of Object.entries(v.seen || {})) if (ID.test(c)) l.seen[c] = num(ts, 0, 4e12);
    for (const [c, a] of Object.entries(v.ans || {})) if (ID.test(c) && a && typeof a === "object") l.ans[c] = { ok: !!a.ok, ts: num(a.ts, 0, 4e12), tries: num(a.tries, 0, 999) };
    for (const [c, ts] of Object.entries(v.deep || {})) if (ID.test(c)) l.deep[c] = num(ts, 0, 4e12);
    out.progress.lessons[id] = l;
  }
  for (const [id, ts] of Object.entries(s.badges || {})) if (ID.test(id)) out.badges[id] = num(ts, 0, 4e12);
  for (const [k, v] of Object.entries(s.q || {})) if (QKEY.test(k) && v) out.q[k] = { r: num(v.r, 0, 1e6), w: num(v.w, 0, 1e6), last: num(v.last, 0, 4e12) };
  for (const [k, v] of Object.entries(s.leitner || {})) if (QKEY.test(k) && v) out.leitner[k] = { box: num(v.box, 1, 5, 1), due: /^\d{4}-\d{2}-\d{2}$/.test(v.due) ? v.due : todayStr() };
  for (const [k, v] of Object.entries(s.mistakes || {})) if (QKEY.test(k) && v) out.mistakes[k] = { count: num(v.count, 0, 1e6), last: num(v.last, 0, 4e12), resolved: !!v.resolved };
  for (const [d, v] of Object.entries(s.time?.days || {})) if (/^\d{4}-\d{2}-\d{2}$/.test(d) && v) out.time.days[d] = { app: num(v.app, 0, 86400), study: num(v.study, 0, 86400) };
  if (Array.isArray(s.time?.hours)) out.time.hours = out.time.hours.map((_, i) => num(s.time.hours[i], 0, 1e8));
  out.streak = { current: num(s.streak?.current, 0, 5000), best: num(s.streak?.best, 0, 5000), last: /^\d{4}-\d{2}-\d{2}$/.test(s.streak?.last || "") ? s.streak.last : "" };
  if (Array.isArray(s.exams)) out.exams = s.exams.slice(-60).map((e) => ({ id: str(e.id, 40), ts: num(e.ts, 0, 4e12), mode: str(e.mode, 12), score: num(e.score, 0, 1000), total: num(e.total, 0, 1000), timed: !!e.timed, by: typeof e.by === "object" && e.by ? Object.fromEntries(Object.entries(e.by).filter(([k]) => ID.test(k)).map(([k, v]) => [k, [num(v?.[0], 0, 1000), num(v?.[1], 0, 1000)]])) : {} }));
  if (s.last && typeof s.last === "object" && ID.test(str(s.last.lesson))) out.last = { course: str(s.last.course), lesson: str(s.last.lesson), ts: num(s.last.ts, 0, 4e12) };
  for (const k of Object.keys(out.counters)) out.counters[k] = num(s.counters?.[k], 0, 1e8);
  for (const [d, v] of Object.entries(s.goalDays || {})) if (/^\d{4}-\d{2}-\d{2}$/.test(d)) out.goalDays[d] = !!v;
  for (const [c, v] of Object.entries(s.xpc || {})) if (ID.test(c)) out.xpc[c] = num(v, 0, 1e7);
  return out;
}

/** mode: "replace" | "merge" (keep the newer / larger entries). Returns {ok, error?}. */
export function importSave(text, mode = "replace") {
  let j;
  try { j = JSON.parse(text); } catch { return { ok: false, error: "json" }; }
  if (!j || j.format !== FORMAT || !j.state) return { ok: false, error: "format" };
  const incoming = sanitizeState(j.state);
  if (mode === "replace") state = incoming;
  else {
    const a = state, b = incoming;
    a.xp = Math.max(a.xp, b.xp);
    for (const [id, l] of Object.entries(b.progress.lessons)) {
      const cur = a.progress.lessons[id];
      if (!cur) { a.progress.lessons[id] = l; continue; }
      cur.done = Math.max(cur.done, l.done); cur.pos = Math.max(cur.pos, l.pos);
      Object.assign(cur.seen, { ...l.seen, ...cur.seen });
      for (const [c, x] of Object.entries(l.ans)) if (!cur.ans[c] || cur.ans[c].ts < x.ts) cur.ans[c] = x;
      Object.assign(cur.deep, { ...l.deep, ...cur.deep });
      cur.quiz = { best: Math.max(cur.quiz.best, l.quiz.best), attempts: Math.max(cur.quiz.attempts, l.quiz.attempts), last: Math.max(cur.quiz.last, l.quiz.last) };
    }
    for (const [k, v] of Object.entries(b.badges)) if (!a.badges[k]) a.badges[k] = v;
    for (const [k, v] of Object.entries(b.q)) { const c = a.q[k]; if (!c || v.r + v.w > c.r + c.w) a.q[k] = v; }
    for (const [k, v] of Object.entries(b.leitner)) { const c = a.leitner[k]; if (!c || v.box > c.box) a.leitner[k] = v; }
    for (const [k, v] of Object.entries(b.mistakes)) { const c = a.mistakes[k]; if (!c || v.last > c.last) a.mistakes[k] = v; }
    for (const [d, v] of Object.entries(b.time.days)) { const c = a.time.days[d]; if (!c) a.time.days[d] = v; else { c.app = Math.max(c.app, v.app); c.study = Math.max(c.study, v.study); } }
    a.time.hours = a.time.hours.map((x, i) => Math.max(x, b.time.hours[i]));
    a.streak = b.streak.best > a.streak.best ? { ...b.streak, best: Math.max(a.streak.best, b.streak.best) } : { ...a.streak, best: Math.max(a.streak.best, b.streak.best) };
    a.exams = [...a.exams, ...b.exams].sort((x, y) => x.ts - y.ts).slice(-60);
    if (!a.last || (b.last && b.last.ts > a.last.ts)) a.last = b.last;
    for (const k of Object.keys(a.counters)) a.counters[k] = Math.max(a.counters[k], b.counters[k]);
    Object.assign(a.goalDays, b.goalDays);
    for (const [c, v] of Object.entries(b.xpc)) a.xpc[c] = Math.max(a.xpc[c] || 0, v);
  }
  if (j.settings && mode === "replace") { settings = { ...DEFAULT_SETTINGS, ...sanitizeSettings(j.settings) }; writeKey(SKEY, settings); emit("settings"); }
  dirty = true; flush(); emit("state");
  return { ok: true };
}

// keep several tabs in step
window.addEventListener("storage", (e) => {
  if (e.key === KEY) { const s = readKey(KEY); if (s) { state = sanitizeState(s); emit("state"); } }
  if (e.key === SKEY) { settings = { ...DEFAULT_SETTINGS, ...sanitizeSettings(readKey(SKEY) || {}) }; emit("settings"); }
});
window.addEventListener("pagehide", flush);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
