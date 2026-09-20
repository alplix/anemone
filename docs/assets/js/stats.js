// Statistics. Everything is computed locally; every chart has a table and a plain-text summary.
import { h, todayStr, addDays, tableWrap } from "./dom.js";
import * as store from "./store.js";
import { t, num, pct, dur, dateLong } from "./i18n.js";
import { loadCourses, computeStats, acc, MIN_ANSWERS, payload, questionsOf, readyLessons } from "./pool.js";
import { progressToNext, rankName } from "./xp.js";
import { setStudyContext } from "./time.js";

const table = (caption, heads, rows, rowHeader = true) => tableWrap(caption, h("table", {},
  h("caption", { text: caption }),
  h("thead", {}, h("tr", {}, heads.map((x) => h("th", { scope: "col", text: x })))),
  h("tbody", {}, rows.map((r) => h("tr", {}, r.map((c, i) => (i === 0 && rowHeader ? h("th", { scope: "row", text: String(c) }) : h("td", { text: String(c) }))))))));

const bar = (v) => h("div", { class: "bar", role: "img", "aria-label": pct(v) }, h("span", { style: `width:${Math.round(v * 100)}%` }));

export async function renderStats(root) {
  setStudyContext(false);
  const courses = await loadCourses();
  const s = store.get();
  const st = computeStats(courses);
  root.textContent = "";

  const totalR = Object.values(st.byCourse).reduce((a, c) => a + c.r, 0), totalW = Object.values(st.byCourse).reduce((a, c) => a + c.w, 0);
  const days = Object.entries(s.time.days);
  const studyTotal = days.reduce((a, [, d]) => a + d.study, 0), appTotal = days.reduce((a, [, d]) => a + d.app, 0);
  const t0 = todayStr();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(t0, -i));
  const weekStudy = weekDays.reduce((a, d) => a + (s.time.days[d]?.study || 0), 0);
  const lessonsDone = Object.values(s.progress.lessons).filter((l) => l.done).length;
  const p = progressToNext(s.xp);

  const tile = (v, k) => h("div", { class: "stat" }, h("span", { class: "v", text: v }), h("span", { class: "k", text: k }));
  root.append(
    h("p", { class: "lead", text: t("stats.summary", { rank: rankName(p.level), level: p.level, xp: num(s.xp), lessons: lessonsDone, answers: num(totalR + totalW), acc: totalR + totalW ? pct(totalR / (totalR + totalW)) : "—", study: dur(studyTotal) }) }),
    h("div", { class: "stat-grid" },
      tile(`${p.level} · ${rankName(p.level)}`, t("stats.level")), tile(num(s.xp), t("stats.xp")), tile(num(lessonsDone), t("stats.lessons-done")),
      tile(totalR + totalW ? pct(totalR / (totalR + totalW)) : "—", t("stats.accuracy")), tile(num(totalR + totalW), t("stats.answered")),
      tile(dur(studyTotal), t("stats.study-time")), tile(dur(appTotal), t("stats.app-time")), tile(`${num(store.streakNow())} / ${num(s.streak.best)}`, t("stats.streak"))));

  // accuracy by course / unit / lesson
  const unitRows = Object.values(st.byUnit).filter((u) => u.ready).map((u) => [u.title, acc(u) == null ? "—" : pct(acc(u)), num(u.r + u.w), `${u.done}/${u.ready}`]);
  const lessonRows = Object.values(st.byLesson).filter((l) => l.status === "ready").map((l) => [l.title, acc(l) == null ? "—" : pct(acc(l)), num(l.r), num(l.w)]);
  root.append(
    h("section", { "aria-labelledby": "s-acc" }, h("h2", { id: "s-acc", text: t("stats.accuracy-title") }),
      ...Object.values(st.byCourse).map((c) => h("p", { text: t("stats.course-line", { title: c.title, acc: c.r + c.w ? pct(c.r / (c.r + c.w)) : "—", n: num(c.r + c.w) }) })),
      unitRows.length ? table(t("stats.by-unit"), [t("stats.h-unit"), t("stats.h-accuracy"), t("stats.h-answers"), t("stats.h-lessons")], unitRows) : h("p", { class: "notice", text: t("stats.no-data") }),
      lessonRows.length ? table(t("stats.by-lesson"), [t("stats.h-lesson"), t("stats.h-accuracy"), t("stats.h-right"), t("stats.h-wrong")], lessonRows) : null,
      ...Object.values(st.byLesson).filter((l) => l.status === "ready" && l.r + l.w).slice(0, 12).map((l) => h("div", { class: "bar-row" }, h("span", { text: l.title }), bar(acc(l) ?? 0), h("span", { class: "small", text: pct(acc(l) ?? 0) })))));

  // weak topics
  const weak = Object.values(st.byLesson).filter((l) => l.r + l.w >= MIN_ANSWERS && acc(l) < 0.7).sort((a, b) => acc(a) - acc(b));
  root.append(h("section", { "aria-labelledby": "s-weak" }, h("h2", { id: "s-weak", text: t("stats.weak-title") }),
    weak.length ? h("ol", {}, weak.map((l) => h("li", {}, h("a", { href: l.url, text: l.title }), ` — ${pct(acc(l))}`))) : h("p", { text: t("study.weak-none", { min: MIN_ANSWERS }) })));

  // time
  const last14 = Array.from({ length: 14 }, (_, i) => addDays(t0, -i)).map((d) => [dateLong(d), dur(s.time.days[d]?.study || 0), dur(s.time.days[d]?.app || 0)]);
  const hours = s.time.hours.map((v, i) => ({ h: i, v })).sort((a, b) => b.v - a.v).filter((x) => x.v > 0).slice(0, 3);
  root.append(h("section", { "aria-labelledby": "s-time" }, h("h2", { id: "s-time", text: t("stats.time-title") }),
    h("p", { text: t("stats.time-summary", { today: dur(s.time.days[t0]?.study || 0), week: dur(weekStudy), total: dur(studyTotal), app: dur(appTotal) }) }),
    h("p", { class: "small muted", text: t("stats.time-note") }),
    table(t("stats.last14"), [t("stats.h-date"), t("stats.h-study"), t("stats.h-app")], last14),
    h("h3", { text: t("stats.hours-title") }),
    hours.length ? h("p", { text: t("stats.hours-summary", { list: hours.map((x) => `${String(x.h).padStart(2, "0")}:00–${String(x.h).padStart(2, "0")}:59 (${dur(x.v)})`).join(", ") }) }) : h("p", { text: t("stats.no-data") }),
    hours.length ? table(t("stats.hours-table"), [t("stats.h-hour"), t("stats.h-study")], s.time.hours.map((v, i) => [`${String(i).padStart(2, "0")}:00`, dur(v)]).filter((r) => r[1] !== dur(0))) : null));

  // per question (lazy)
  const det = h("details", { class: "toc" }, h("summary", { text: t("stats.per-question") }));
  let loaded = false;
  det.addEventListener("toggle", async () => {
    if (!det.open || loaded) return;
    loaded = true;
    const body = h("div", { text: t("panel.loading") });
    det.append(body);
    const rows = [];
    for (const c of courses) for (const l of readyLessons(c)) {
      const items = questionsOf(await payload(c.id, l.id));
      for (const it of items) { const q = s.q[it.key]; if (q) rows.push([it.q.prompt || it.q.scenario, l.title, num(q.r), num(q.w), pct(q.r / (q.r + q.w))]); }
    }
    body.replaceWith(rows.length ? table(t("stats.per-question"), [t("stats.h-question"), t("stats.h-lesson"), t("stats.h-right"), t("stats.h-wrong"), t("stats.h-accuracy")], rows.sort((a, b) => Number(b[3]) - Number(a[3]))) : h("p", { text: t("stats.no-data") }));
  });
  root.append(det);
}
