// Recording answers: per-question statistics, Leitner boxes, the mistakes notebook, streak and badges.
import * as store from "./store.js";
import { addDays, todayStr } from "./dom.js";
import { addXp, RULES, checkBadges } from "./xp.js";

export const INTERVALS = [0, 1, 2, 4, 8, 16]; // days until the next review, by Leitner box 1..5

export const qkey = (lesson, id) => `${lesson}/${id}`;

/** Records one graded answer. Returns { firstRight, wasWrongBefore }. */
export function record(key, ok, source) {
  const s = store.get();
  const q = (s.q[key] ||= { r: 0, w: 0, last: 0 });
  const firstRight = ok && q.r === 0;
  const wasWrongBefore = q.w > 0 && q.r === 0;
  if (ok) q.r++; else q.w++;
  q.last = Date.now();
  s.counters.questions++;
  if (ok) s.counters.right++;
  if (source === "review") s.counters.reviews++;
  const lt = (s.leitner[key] ||= { box: 1, due: todayStr() });
  lt.box = ok ? Math.min(5, lt.box + 1) : 1;
  lt.due = addDays(todayStr(), INTERVALS[lt.box]);
  if (!ok) s.mistakes[key] = { count: (s.mistakes[key]?.count || 0) + 1, last: Date.now(), resolved: false };
  else if (s.mistakes[key]) s.mistakes[key].resolved = true;
  if (store.streakTouch()) { /* first activity of the day keeps the streak */ }
  store.touch();
  checkBadges();
  return { firstRight, wasWrongBefore };
}

export function dueKeys(today = todayStr()) {
  const s = store.get();
  return Object.entries(s.leitner).filter(([, v]) => v.due <= today).sort((a, b) => a[1].box - b[1].box || (a[1].due < b[1].due ? -1 : 1)).map(([k]) => k);
}
export function openMistakes() {
  return Object.entries(store.get().mistakes).filter(([, v]) => !v.resolved).sort((a, b) => b[1].last - a[1].last).map(([k]) => k);
}
export function accuracy(key) {
  const q = store.get().q[key];
  if (!q || q.r + q.w === 0) return null;
  return q.r / (q.r + q.w);
}
export { addXp, RULES };
