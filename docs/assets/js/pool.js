// Access to question pools (per-lesson JSON files, fetched lazily) and shared statistics helpers.
import * as store from "./store.js";
import { getJson, body } from "./i18n.js";
import { loadCourse } from "./map.js";

export const courseIds = () => (body().dataset.courses || "mass-communication-theories").split(" ").filter(Boolean);

export async function loadCourses() {
  return Promise.all(courseIds().map((id) => loadCourse(id)));
}

const payloads = new Map();
export async function payload(courseId, lessonId) {
  const k = courseId + "/" + lessonId;
  if (!payloads.has(k)) payloads.set(k, getJson(`${courseId}/q/${lessonId}.json`).catch(() => null));
  return payloads.get(k);
}

/** All questions of a payload as [{ key, q, lesson, unit, title, from }]. */
export function questionsOf(p) {
  if (!p) return [];
  const out = [];
  for (const q of Object.values(p.cards)) out.push({ key: `${p.lesson}/${q.id}`, q, lesson: p.lesson, unit: p.unit, title: p.title, from: "card" });
  for (const q of p.quiz) out.push({ key: `${p.lesson}/${q.id}`, q, lesson: p.lesson, unit: p.unit, title: p.title, from: "quiz" });
  return out;
}

export function readyLessons(course) {
  return course.units.flatMap((u) => u.lessons.filter((l) => l.status === "ready").map((l) => ({ ...l, unit: u.id, unitTitle: u.title })));
}

export async function poolFor(courses, filter) {
  const out = [];
  for (const c of courses) {
    for (const l of readyLessons(c)) {
      if (filter && !filter(l, c)) continue;
      const p = await payload(c.id, l.id);
      out.push(...questionsOf(p).map((x) => ({ ...x, course: c.id, unitTitle: l.unitTitle })));
    }
  }
  return out;
}

/** Per-lesson / per-unit accuracy from the saved per-question counters. */
export function computeStats(courses) {
  const s = store.get();
  const byLesson = {}, byUnit = {}, byCourse = {};
  for (const c of courses) {
    byCourse[c.id] = { title: c.title, r: 0, w: 0 };
    for (const u of c.units) {
      byUnit[u.id] = { title: u.title, r: 0, w: 0, course: c.id, lessons: u.lessons.length, done: 0, ready: 0 };
      for (const l of u.lessons) {
        byLesson[l.id] = { title: l.title, unit: u.id, r: 0, w: 0, url: l.url, status: l.status };
        if (l.status === "ready") { byUnit[u.id].ready++; if (s.progress.lessons[l.id]?.done) byUnit[u.id].done++; }
      }
    }
  }
  for (const [key, v] of Object.entries(s.q)) {
    const lesson = key.split("/")[0];
    const L = byLesson[lesson];
    if (!L) continue;
    L.r += v.r; L.w += v.w;
    const U = byUnit[L.unit]; U.r += v.r; U.w += v.w;
    const C = byCourse[U.course]; C.r += v.r; C.w += v.w;
  }
  return { byLesson, byUnit, byCourse };
}
export const acc = (o) => (o.r + o.w ? o.r / (o.r + o.w) : null);
export const MIN_ANSWERS = 5; // accuracy is only trusted after this many answers
