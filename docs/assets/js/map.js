// Course map: open / done / planned states, soft prerequisites and the "continue where you left off" links.
import { $, $$, h } from "./dom.js";
import * as store from "./store.js";
import { getJson, t, base, langPath } from "./i18n.js";

export async function loadCourse(courseId) {
  return getJson(`course-${courseId}.json`);
}

export function lessonStates(course) {
  const s = store.get().progress.lessons;
  const byId = {};
  course.units.forEach((u) => u.lessons.forEach((l) => { byId[l.id] = l; }));
  const state = {};
  for (const l of Object.values(byId)) {
    const done = !!s[l.id]?.done;
    const missing = l.prereq.filter((p) => !s[p]?.done);
    const started = !!s[l.id]?.started;
    state[l.id] = { done, missing, started, planned: l.status !== "ready", lesson: l };
  }
  return state;
}

/** The lesson to continue with: the last one opened (if unfinished), else the first ready lesson that is not done. */
export function continueTarget(course) {
  const st = lessonStates(course);
  const last = store.get().last;
  if (last && st[last.lesson] && !st[last.lesson].done && !st[last.lesson].planned) return { ...st[last.lesson], pos: store.get().progress.lessons[last.lesson]?.pos || 0, resumed: true };
  const all = course.units.flatMap((u) => u.lessons);
  const first = all.find((l) => l.status === "ready" && !st[l.id].done && st[l.id].missing.filter((m) => st[m] && !st[m].planned).length === 0) || all.find((l) => l.status === "ready" && !st[l.id].done);
  return first ? { ...st[first.id], pos: 0, resumed: false } : null;
}

export async function decorateMap() {
  const root = $("#course-map");
  if (!root) return;
  const course = await loadCourse(root.dataset.course);
  const st = lessonStates(course);
  $$(".lesson-item", root).forEach((li) => {
    const id = li.dataset.lesson;
    const s = st[id];
    if (!s) return;
    const el = $("[data-role=state]", li);
    let state = "open", text = t("state.available");
    if (s.planned) { state = "planned"; text = t("state.planned"); }
    else if (s.done) { state = "done"; text = "✓ " + t("state.done"); }
    else if (s.missing.some((m) => st[m] && !st[m].planned)) {
      state = "locked";
      const names = s.missing.filter((m) => st[m] && !st[m].planned).map((m) => st[m].lesson.title).join(", ");
      text = t("state.recommended-first", { names });
    } else if (s.started) text = t("state.in-progress");
    li.dataset.state = state;
    if (el) el.textContent = text;
  });
  // unit progress
  $$(".unit", root).forEach((u) => {
    const uid = u.dataset.unit;
    const unit = course.units.find((x) => x.id === uid);
    if (!unit) return;
    const ready = unit.lessons.filter((l) => l.status === "ready");
    const done = ready.filter((l) => st[l.id].done).length;
    if (!ready.length) return;
    const p = h("p", { class: "small", text: t("map.unit-progress", { done, total: ready.length }) });
    $("h2", u).after(p);
  });
}

export async function decorateContinue() {
  const links = $$("#continue-link");
  if (!links.length) return;
  for (const a of links) {
    const courseId = a.dataset.course || "mass-communication-theories";
    let course;
    try { course = await loadCourse(courseId); } catch { continue; }
    const target = continueTarget(course);
    if (!target) continue;
    a.href = target.lesson.url;
    a.textContent = target.resumed && target.pos > 0 ? t("continue.card", { title: target.lesson.title, n: target.pos + 1 }) : target.resumed ? t("continue.lesson", { title: target.lesson.title }) : t("continue.start", { title: target.lesson.title });
    a.hidden = false;
  }
}
