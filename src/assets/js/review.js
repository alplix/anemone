// Daily review (Leitner boxes) and the mistakes notebook.
import { h, focusEl, announce, addDays, todayStr, tableWrap, setTitle, shuffle } from "./dom.js";
import { getJson } from "./i18n.js";
import * as store from "./store.js";
import { t, num, pct, dateLong } from "./i18n.js";
import { loadCourses, payload, questionsOf, readyLessons } from "./pool.js";
import { dueKeys, openMistakes, record, RULES, addXp, INTERVALS } from "./learn.js";
import { mountQuestion } from "./questions.js";
import { setStudyContext } from "./time.js";
import { checkBadges } from "./xp.js";

const SESSION = 10;

async function resolve(keys) {
  const courses = await loadCourses();
  const lessonToCourse = {};
  courses.forEach((c) => c.units.forEach((u) => u.lessons.forEach((l) => { if (l.status === "ready") lessonToCourse[l.id] = c.id; })));
  const out = [];
  const cache = {};
  for (const key of keys) {
    const [lesson, qid] = key.split("/");
    const cid = lessonToCourse[lesson];
    if (!cid) continue;
    cache[lesson] ||= questionsOf(await payload(cid, lesson));
    const item = cache[lesson].find((x) => x.q.id === qid);
    if (item) out.push(item);
  }
  return out;
}

/** Questions the reader is ready for, ordered by need: due for review > open mistakes > new (only from what was read). */
async function buildQueue(lessonFilter) {
  const courses = await loadCourses();
  const s = store.get(), today = todayStr();
  const scored = [];
  for (const c of courses) for (const l of readyLessons(c)) {
    const ls = s.progress.lessons[l.id];
    const explicit = !!lessonFilter && l.id === lessonFilter;
    if (lessonFilter && !explicit) continue;
    if (!explicit && !(ls && Object.keys(ls.seen).length)) continue; // nothing read there yet
    const p = await payload(c.id, l.id);
    if (!p) continue;
    const core = p.order.filter((o) => o.layer === "core");
    const readFrac = ls ? core.filter((o) => ls.seen[o.id]).length / Math.max(1, core.length) : 0;
    const cand = [
      ...Object.entries(p.cards).filter(([cardId]) => explicit || ls?.seen[cardId]).map(([, q]) => q),
      ...(explicit || readFrac >= 0.6 ? p.quiz : []),
    ];
    for (const q of cand) {
      const key = l.id + "/" + q.id, lt = s.leitner[key], mist = s.mistakes[key], seenBefore = s.q[key];
      let score, tag;
      if (lt && lt.due <= today) { score = 100; tag = "due"; }
      else if (mist && !mist.resolved) { score = 70; tag = "mistake"; }
      else if (!seenBefore) { score = 40 + readFrac * 10; tag = "new"; }
      else if (explicit) { score = 5; tag = "again"; }
      else continue;
      scored.push({ key, q, lesson: l.id, title: p.title, unit: p.unit, tag, score: score + Math.random() * 12 });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  const counts = { due: 0, mistake: 0, new: 0, again: 0 };
  scored.forEach((x) => { counts[x.tag]++; });
  // take the ten most needed, then avoid three questions in a row from one lesson
  const top = scored.slice(0, SESSION), ordered = [];
  while (top.length) {
    const i = top.findIndex((x) => !(ordered.length >= 2 && ordered.at(-1).lesson === x.lesson && ordered.at(-2).lesson === x.lesson));
    ordered.push(top.splice(i < 0 ? 0 : i, 1)[0]);
  }
  return { items: ordered, counts, total: scored.length };
}

export async function renderReview(root) {
  setStudyContext(true);
  const s = store.get();
  const lessonFilter = new URLSearchParams(location.search).get("lesson") || "";
  const smart = await buildQueue(lessonFilter);
  const due = dueKeys(), mistakes = openMistakes();
  const boxes = [1, 2, 3, 4, 5].map((b) => Object.values(s.leitner).filter((v) => v.box === b).length);
  const upcoming = Object.values(s.leitner).map((v) => v.due).filter((d) => d > todayStr()).sort()[0];
  root.textContent = "";
  root.append(
    h("p", { class: "lead", text: t("review.intro") }),
    h("section", { "aria-labelledby": "rv-smart" },
      h("h2", { id: "rv-smart", text: t("q.smart-title") }),
      smart.items.length
        ? h("div", {}, h("p", { text: t("q.smart-line", { total: num(smart.total), due: num(smart.counts.due), mistake: num(smart.counts.mistake), fresh: num(smart.counts.new) }) }),
          lessonFilter ? h("p", { class: "small muted", text: t("q.smart-lesson", { title: smart.items[0].title }) }) : null,
          h("button", { type: "button", class: "btn btn-primary", onclick: () => runItems(root, smart.items) }, t("q.smart-start", { n: smart.items.length })))
        : h("p", { class: "notice", text: Object.keys(s.progress.lessons).length ? t("q.smart-caught-up") : t("q.smart-none-read") })),
    h("section", { "aria-labelledby": "rv-due" },
      h("h2", { id: "rv-due", text: t("review.due-title") }),
      h("p", { text: t("review.due-line", { n: num(due.length) }) }),
      due.length ? h("button", { type: "button", class: "btn btn-primary", onclick: () => run(root, due.slice(0, SESSION), "review") }, t("review.start", { n: Math.min(SESSION, due.length) })) : h("p", { class: "notice", text: upcoming ? t("review.none-next", { date: dateLong(upcoming) }) : t("review.none-yet") })),
    h("section", { "aria-labelledby": "rv-mist" },
      h("h2", { id: "rv-mist", text: t("review.mistakes-title") }),
      h("p", { text: t("review.mistakes-line", { n: num(mistakes.length) }) }),
      mistakes.length ? h("button", { type: "button", class: "btn", onclick: () => run(root, mistakes.slice(0, SESSION), "mistakes") }, t("review.mistakes-start", { n: Math.min(SESSION, mistakes.length) })) : null),
    h("section", {},
      h("h2", { id: "rv-boxes", text: t("review.boxes-title") }),
      h("p", { text: t("review.boxes-help", { days: INTERVALS.slice(1).join(", ") }) }),
      tableWrap(t("review.boxes-title"), h("table", {},
        h("caption", { class: "sr-only", text: t("review.boxes-title") }),
        h("thead", {}, h("tr", {}, h("th", { scope: "col", text: t("review.box") }), h("th", { scope: "col", text: t("review.box-count") }), h("th", { scope: "col", text: t("review.box-interval") }))),
        h("tbody", {}, boxes.map((n, i) => h("tr", {}, h("th", { scope: "row", text: String(i + 1) }), h("td", { text: num(n) }), h("td", { text: t("review.days", { n: INTERVALS[i + 1] }) })))))),
      h("p", { class: "small muted", text: t("review.boxes-summary", { total: num(Object.keys(s.leitner).length) }) })),
    h("section", { "aria-labelledby": "rv-flash" },
      h("h2", { id: "rv-flash", text: t("flash.title") }),
      h("p", { text: t("flash.intro") }),
      h("button", { type: "button", class: "btn", onclick: () => flashcards(root) }, t("flash.start"))),
  );
}

async function run(root, keys, kind) {
  runItems(root, await resolve(keys));
}

function runItems(root, items) {
  root.textContent = "";
  if (!items.length) { root.append(h("p", { class: "notice", text: t("review.empty-session") })); return; }
  const head = h("h2", { tabindex: "-1" });
  const holder = h("div", {});
  root.append(head, holder);
  let i = 0, right = 0;
  const wrong = [];
  const show = () => {
    holder.textContent = "";
    if (i >= items.length) return summary();
    const it = items[i];
    head.textContent = t("review.q-of", { n: i + 1, total: items.length });
    setTitle(head.textContent);
    holder.append(h("p", { class: "small muted", text: t("review.from", { title: it.title }) }));
    mountQuestion(holder, it.q, {
      onAnswer: (res) => {
        const rec = record(it.key, res.ok, "review");
        if (res.ok) { right++; addXp(rec.firstRight ? RULES.miniFirst : RULES.review, "review"); } else wrong.push(it);
      },
      continueLabel: i === items.length - 1 ? t("review.finish") : t("q.continue"),
      onContinue: () => { i++; show(); },
    });
    focusEl(head);
  };
  const summary = () => {
    head.textContent = t("review.done-title");
    holder.append(
      h("p", { class: "lead", text: t("review.done-line", { right, total: items.length, pct: pct(right / items.length) }) }),
      wrong.length ? h("div", {}, h("h3", { text: t("quiz.missed") }), h("ul", {}, wrong.map((w) => h("li", {}, h("a", { href: w.unitTitle ? "#" : "#", onclick: (e) => e.preventDefault() }, w.q.prompt || w.q.scenario))))) : null,
      h("div", { class: "btn-row" }, h("button", { type: "button", class: "btn btn-primary", onclick: () => renderReview(root) }, t("review.back"))));
    announce(t("review.done-line", { right, total: items.length, pct: pct(right / items.length) }));
    checkBadges();
    focusEl(head);
  };
  show();
}

// Glossary flashcards: term first, then the definition on request. Self-rated, no scheduling; a few XP per card.
async function flashcards(root) {
  let tips;
  try { tips = await getJson("tips.json"); } catch { root.textContent = ""; root.append(h("p", { class: "notice", text: t("panel.error") })); return; }
  const deck = shuffle(tips.concepts).slice(0, 15);
  root.textContent = "";
  if (!deck.length) { root.append(h("p", { class: "notice", text: t("flash.empty") })); return; }
  const head = h("h2", { tabindex: "-1" });
  const body = h("div", {});
  root.append(head, body);
  let i = 0, known = 0;
  const show = () => {
    body.textContent = "";
    if (i >= deck.length) {
      head.textContent = t("flash.done");
      setTitle(head.textContent);
      body.append(h("p", { class: "lead", text: t("flash.done-line", { known, total: deck.length }) }), h("div", { class: "btn-row" }, h("button", { type: "button", class: "btn btn-primary", onclick: () => renderReview(root) }, t("review.back"))));
      announce(t("flash.done-line", { known, total: deck.length }));
      focusEl(head);
      return;
    }
    const c = deck[i];
    head.textContent = t("flash.card-of", { n: i + 1, total: deck.length });
    setTitle(head.textContent);
    const answer = h("div", { hidden: true, tabindex: "-1" }, h("p", { class: "lead", text: c.short }), h("p", {}, h("a", { href: c.url, text: t("tip.more") })));
    const rate = h("div", { class: "btn-row", hidden: true },
      h("button", { type: "button", class: "btn btn-primary", onclick: () => { known++; addXp(1, "flash"); i++; show(); } }, t("flash.knew")),
      h("button", { type: "button", class: "btn", onclick: () => { i++; show(); } }, t("flash.again")));
    const reveal = h("button", { type: "button", class: "btn btn-primary", onclick: () => { answer.hidden = false; rate.hidden = false; reveal.hidden = true; focusEl(answer); } }, t("flash.reveal"));
    body.append(h("p", { class: "lead", text: c.name }), reveal, answer, rate);
    focusEl(head);
  };
  show();
}
