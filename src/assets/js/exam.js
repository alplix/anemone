// Exams: unit boss exams, mixed mock exams, mistakes exam; timed or untimed; result + per-topic analysis.
import { h, focusEl, announce, shuffle, tableWrap, setTitle } from "./dom.js";
import * as store from "./store.js";
import { t, num, pct, dur } from "./i18n.js";
import { loadCourses, poolFor, readyLessons } from "./pool.js";
import { record, RULES, addXp, openMistakes } from "./learn.js";
import { mountQuestion } from "./questions.js";
import { setStudyContext } from "./time.js";
import { checkBadges } from "./xp.js";

const SEC_PER_Q = 60;

export async function renderExam(root) {
  setStudyContext(false);
  const courses = await loadCourses();
  const course = courses[0];
  const ready = readyLessons(course);
  const units = course.units.filter((u) => u.lessons.some((l) => l.status === "ready"));
  root.textContent = "";
  if (!ready.length) { root.append(h("p", { class: "notice", text: t("exam.none-ready") })); return; }
  const s = store.get();

  const kind = h("select", { id: "ex-kind" },
    h("option", { value: "unit", text: t("exam.kind-unit") }), h("option", { value: "mock", text: t("exam.kind-mock") }), h("option", { value: "mistakes", text: t("exam.kind-mistakes") }));
  const unit = h("select", { id: "ex-unit" }, units.map((u) => h("option", { value: u.id, text: u.title })));
  const timed = h("input", { type: "checkbox", id: "ex-timed" });
  const size = h("select", { id: "ex-size" }, [10, 15, 25, 40].map((n) => h("option", { value: n, text: t("exam.n-questions", { n }), selected: n === 15 ? true : null })));
  const status = h("p", { role: "status", class: "small" });
  const start = h("button", { type: "button", class: "btn btn-primary", onclick: async () => {
    start.disabled = true; status.textContent = t("exam.preparing");
    let pool = [];
    if (kind.value === "unit") pool = await poolFor([course], (l) => l.unit === unit.value);
    else if (kind.value === "mock") pool = await poolFor([course]);
    else { const keys = new Set(openMistakes()); pool = (await poolFor([course])).filter((x) => keys.has(x.key)); }
    // one question per key, exclude nothing else; case questions count as one
    const n = Math.min(Number(size.value), pool.length);
    if (!n) { status.textContent = t("exam.empty-pool"); start.disabled = false; return; }
    run(root, { pool: shuffle(pool).slice(0, n), kind: kind.value, unit: kind.value === "unit" ? unit.value : "", timed: timed.checked });
  } }, t("exam.start"));

  root.append(
    h("p", { class: "lead", text: t("exam.intro") }),
    h("fieldset", {}, h("legend", { text: t("exam.setup") }),
      h("div", { class: "field" }, h("label", { for: "ex-kind", text: t("exam.kind") }), kind),
      h("div", { class: "field" }, h("label", { for: "ex-unit", text: t("exam.unit") }), unit),
      h("div", { class: "field" }, h("label", { for: "ex-size", text: t("exam.size") }), size),
      h("div", { class: "field" }, timed, h("label", { for: "ex-timed", text: t("exam.timed", { sec: SEC_PER_Q }) })),
      h("div", { class: "btn-row" }, start), status),
    s.exams.length ? h("section", { "aria-labelledby": "ex-hist" }, h("h2", { id: "ex-hist", text: t("exam.history") }), tableWrap(t("exam.history"), h("table", {},
      h("thead", {}, h("tr", {}, ["exam.h-date", "exam.h-kind", "exam.h-score", "exam.h-timed"].map((k) => h("th", { scope: "col", text: t(k) })))),
      h("tbody", {}, [...s.exams].reverse().slice(0, 10).map((e) => h("tr", {}, h("td", { text: new Date(e.ts).toLocaleDateString() }), h("td", { text: t("exam.kind-" + e.mode) }), h("td", { text: `${e.score}/${e.total} (${pct(e.total ? e.score / e.total : 0)})` }), h("td", { text: e.timed ? t("common.yes") : t("common.no") }))))))) : null,
  );
}

function run(root, cfg) {
  const { pool } = cfg;
  root.textContent = "";
  const head = h("h2", { tabindex: "-1" });
  const timerEl = h("p", { role: "timer", "aria-live": "off", class: "muted" });
  const timeBtn = h("button", { type: "button", class: "btn btn-ghost", onclick: () => announce(t("exam.time-left", { t: dur(left) })) }, t("exam.ask-time"));
  const holder = h("div", {});
  const prog = h("progress", { max: pool.length, value: 0, "aria-label": t("exam.progress") });
  root.append(head, prog, cfg.timed ? h("div", {}, timerEl, timeBtn) : null, holder);
  setStudyContext(true);
  let i = 0, left = pool.length * SEC_PER_Q, ticking = null;
  const answers = [];
  const finish = (auto) => {
    clearInterval(ticking);
    setStudyContext(false);
    const by = {};
    let score = 0;
    pool.forEach((it, k) => {
      const a = answers[k];
      const ok = !!a?.ok;
      if (a) record(it.key, ok, "exam"); else record(it.key, false, "exam");
      if (ok) score++;
      const b = (by[it.lesson] ||= [0, 0]);
      b[1]++; if (ok) b[0]++;
    });
    addXp(score * RULES.examRight, "exam");
    const ratio = score / pool.length;
    const s = store.get();
    let bonus = false;
    if (cfg.kind === "unit" && ratio >= 0.8 && !s.exams.some((e) => e.id === `unit-${cfg.unit}` && e.score / e.total >= 0.8)) { addXp(RULES.boss, "boss"); bonus = true; }
    s.exams.push({ id: cfg.kind === "unit" ? `unit-${cfg.unit}` : cfg.kind, ts: Date.now(), mode: cfg.kind, score, total: pool.length, timed: cfg.timed, by });
    s.exams = s.exams.slice(-60);
    store.touch();
    checkBadges();
    render(root, { ...cfg, score, by, answers, auto, bonus });
  };
  const show = () => {
    holder.textContent = "";
    if (i >= pool.length) return finish(false);
    head.textContent = t("exam.q-of", { n: i + 1, total: pool.length });
    setTitle(head.textContent);
    prog.value = i;
    const it = pool[i];
    mountQuestion(holder, it.q, {
      deferFeedback: true,
      onAnswer: (res) => { answers[i] = res; },
      continueLabel: i === pool.length - 1 ? t("exam.finish") : t("exam.next"),
      onContinue: () => { i++; show(); },
    });
    focusEl(head);
  };
  if (cfg.timed) {
    const fmt = () => { const m = Math.floor(left / 60), s = left % 60; timerEl.textContent = t("exam.time-left", { t: `${m}:${String(s).padStart(2, "0")}` }); };
    fmt();
    ticking = setInterval(() => {
      left--; fmt();
      if (left === 300 || left === 60 || left === 30) announce(t("exam.time-left", { t: dur(left) }));
      if (left <= 0) { clearInterval(ticking); announce(t("exam.time-up")); finish(true); }
    }, 1000);
  }
  show();
}

function render(root, r) {
  root.textContent = "";
  const { pool, score, by, answers } = r;
  const ratio = score / pool.length;
  const head = h("h2", { tabindex: "-1", text: t("exam.result") });
  setTitle(t("exam.result"));
  const rows = Object.entries(by).map(([lesson, [ok, tot]]) => ({ lesson, ok, tot, title: pool.find((p) => p.lesson === lesson)?.title || lesson }));
  const weakest = [...rows].sort((a, b) => a.ok / a.tot - b.ok / b.tot)[0];
  const missed = pool.map((it, k) => ({ it, a: answers[k] })).filter((x) => !x.a?.ok);
  root.append(head,
    r.auto ? h("p", { class: "notice", text: t("exam.time-up") }) : null,
    h("p", { class: "lead", text: t("exam.score-line", { score, total: pool.length, pct: pct(ratio) }) }),
    r.bonus ? h("p", { class: "callout", text: t("exam.boss-bonus", { xp: RULES.boss }) }) : null,
    h("p", { text: weakest && weakest.ok < weakest.tot ? t("exam.weakest", { title: weakest.title, ok: weakest.ok, tot: weakest.tot }) : t("exam.no-weak") }),
    tableWrap(t("exam.by-topic"), h("table", {},
      h("caption", { text: t("exam.by-topic") }),
      h("thead", {}, h("tr", {}, ["exam.h-topic", "exam.h-correct", "exam.h-total", "exam.h-rate"].map((k) => h("th", { scope: "col", text: t(k) })))),
      h("tbody", {}, rows.map((x) => h("tr", {}, h("th", { scope: "row", text: x.title }), h("td", { text: num(x.ok) }), h("td", { text: num(x.tot) }), h("td", { text: pct(x.ok / x.tot) })))))),
    missed.length ? h("section", { "aria-labelledby": "ex-missed" }, h("h3", { id: "ex-missed", text: t("exam.review-missed") }),
      h("ol", {}, missed.map(({ it }) => h("li", {}, h("strong", { text: it.q.prompt || it.q.scenario }), h("br"), h("span", { class: "small muted", text: t("review.from", { title: it.title }) }), it.q.explain ? h("p", { text: it.q.explain }) : null)))) : null,
    h("div", { class: "btn-row" },
      missed.length ? h("button", { type: "button", class: "btn btn-primary", onclick: () => run(root, { ...r, pool: shuffle(missed.map((m) => m.it)), kind: "mistakes", unit: "" }) }, t("exam.retry-missed")) : null,
      h("button", { type: "button", class: "btn", onclick: () => renderExam(root) }, t("exam.back"))));
  announce(t("exam.score-line", { score, total: pool.length, pct: pct(ratio) }));
  focusEl(head);
}
