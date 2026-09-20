// Lesson page enhancement. The page is complete static HTML; this turns it into a card reader with mini
// questions, a lesson test, progress saving and "continue where you left off". Every step is keyboard operable and
// announced in words; nothing depends on colour, sound or drag and drop.
import { $, $$, h, announce, toast, focusEl, setTitle } from "./dom.js";
import * as store from "./store.js";
import { t, num, pct, getJson } from "./i18n.js";
import { mountQuestion } from "./questions.js";
import { record, qkey, RULES, addXp } from "./learn.js";
import { checkBadges } from "./xp.js";
import { setStudyContext } from "./time.js";
import { openDialog } from "./dialog.js";

export async function initLesson() {
  const article = $("article.lesson[data-lesson]");
  if (!article) return;
  let P;
  try { P = await getJson(`${article.dataset.course}/q/${article.dataset.lesson}.json`); } catch { return; } // static page stays readable

  const lessonId = P.lesson;
  const bodyEl = $("#lesson-body");
  const quizSection = $("#quiz");
  const cardEls = $$(".card", bodyEl);
  const ls = () => store.lessonState(lessonId);
  setStudyContext(true);

  const st = store.get();
  st.last = { course: P.course, lesson: lessonId, ts: Date.now() };
  if (!ls().started) ls().started = Date.now();
  store.touch(true);

  // hide the no-JS question blocks; interactive ones replace them
  $$(".q-static", article).forEach((el) => { el.hidden = true; });
  const quizStatic = quizSection ? [...quizSection.children].filter((c) => c.tagName !== "H2") : [];
  quizStatic.forEach((el) => { el.hidden = true; });

  // ---- steps: one core card + the deep cards that follow it -------------------------------------
  const steps = [];
  cardEls.forEach((el) => {
    if (el.dataset.layer === "core" || !steps.length) steps.push({ els: [el], core: el, title: (el.querySelector("h3")?.textContent || "").trim() });
    else steps.at(-1).els.push(el);
  });
  const coreIds = cardEls.filter((el) => el.dataset.layer === "core").map((el) => el.dataset.card);
  const total = steps.length;
  let cur = 0;
  let stage = "cards"; // cards | quiz

  const secLabel = (el) => t("section." + el.dataset.section);
  const seenCount = () => coreIds.filter((id) => ls().seen[id]).length;

  // ---- marking progress ---------------------------------------------------------------------
  function markSeen(id, layer) {
    const l = ls();
    if (l.seen[id]) return;
    l.seen[id] = Date.now();
    const s = store.get();
    if (layer === "deep") { s.counters.deep++; l.deep[id] = Date.now(); addXp(RULES.deep, "deep"); }
    else { s.counters.cards++; addXp(RULES.card, "card"); }
    if (store.streakTouch()) { /* keeps the streak alive */ }
    store.touch();
    checkDone();
    checkBadges();
  }
  function checkDone() {
    const l = ls();
    if (!l.done && coreIds.every((id) => l.seen[id])) {
      l.done = Date.now();
      addXp(RULES.lessonDone, "lesson");
      store.touch();
      toast(t("lesson.done.title"), t("lesson.done.msg", { title: P.title }));
      checkBadges();
    }
  }

  // ---- interactive mini questions -----------------------------------------------------------
  cardEls.forEach((el) => {
    const id = el.dataset.card;
    const q = P.cards[id];
    if (el.dataset.layer === "deep") el.addEventListener("toggle", () => { if (el.open) markSeen(id, "deep"); });
    if (!q) return;
    const host = h("div", { class: "q-live" }, h("p", { class: "small muted", text: t("lesson.mini-hint") }));
    el.append(host);
    const prev = ls().ans[id];
    if (prev) host.append(h("p", { class: "small", text: prev.ok ? t("lesson.q-before-right") : t("lesson.q-before-wrong") }));
    mountQuestion(host, q, {
      onAnswer: (res) => {
        const r = record(qkey(lessonId, q.id), res.ok, "card");
        const a = (ls().ans[id] ||= { ok: false, ts: 0, tries: 0 });
        a.tries++; a.ts = Date.now(); a.ok = a.ok || res.ok;
        if (r.firstRight) addXp(RULES.miniFirst, "mini");
        else if (r.wasWrongBefore && res.ok) addXp(RULES.miniLater, "mini");
        store.touch();
      },
      onContinue: () => { if (stage === "cards" && store.getSettings().reading === "cards") next(); },
      continueLabel: t("reader.next"),
    });
  });

  // ---- reader bar ---------------------------------------------------------------------------
  const mount = $("#reader-mount");
  const secEl = h("span", { class: "small muted" });
  const countEl = h("span", { class: "small", "aria-hidden": "true" });
  const prog = h("progress", { max: total, value: 1, "aria-label": t("reader.progress") });
  const modeBtn = h("button", { type: "button", class: "btn btn-ghost", onclick: toggleMode });
  const tocBtn = h("button", { type: "button", class: "btn btn-ghost", onclick: openToc }, t("reader.contents"));
  const bar = h("div", { class: "reader-bar", role: "region", "aria-label": t("reader.region") },
    h("div", { class: "row" }, secEl, countEl), prog, h("div", { class: "reader-controls" }, tocBtn, modeBtn));
  mount.append(bar);

  const prevBtn = h("button", { type: "button", class: "btn", onclick: () => prev() }, `← ${t("reader.prev")}`);
  const nextBtn = h("button", { type: "button", class: "btn btn-primary", onclick: () => next() });
  const nav = h("div", { class: "reader-nav" }, prevBtn, nextBtn);
  bodyEl.after(nav);

  function updateModeLabel() { modeBtn.textContent = store.getSettings().reading === "cards" ? t("reader.to-scroll") : t("reader.to-cards"); }

  function toggleMode() {
    store.setSetting("reading", store.getSettings().reading === "cards" ? "scroll" : "cards");
    applyMode(true);
  }

  // ---- card mode ----------------------------------------------------------------------------
  function decorateHeading(step, i) {
    const hd = step.core.querySelector("h3");
    if (!hd) return;
    let sr = hd.querySelector(".sr-only");
    if (!sr) { sr = h("span", { class: "sr-only" }); hd.prepend(sr); }
    sr.textContent = t("reader.card-of", { n: i + 1, total }) + " ";
  }

  function showStep(i, focus) {
    stage = "cards";
    cur = Math.max(0, Math.min(total - 1, i));
    const l = ls();
    l.pos = cur;
    steps.forEach((s, j) => s.els.forEach((el) => { el.hidden = j !== cur; }));
    $$(".lesson-section", bodyEl).forEach((sec) => {
      if (sec.id === "quiz") { sec.hidden = true; return; }
      sec.hidden = !sec.querySelector(".card:not([hidden])");
    });
    const step = steps[cur];
    decorateHeading(step, cur);
    markSeen(step.core.dataset.card, step.core.dataset.layer === "deep" ? "deep" : "core");
    secEl.textContent = secLabel(step.core);
    countEl.textContent = t("reader.count", { n: cur + 1, total });
    prog.max = total; prog.value = cur + 1;
    prog.setAttribute("aria-valuetext", t("reader.card-of", { n: cur + 1, total }));
    prevBtn.disabled = cur === 0;
    nextBtn.textContent = cur === total - 1 ? t("reader.start-quiz") : `${t("reader.next")} →`;
    nav.hidden = false;
    setTitle(`${t("reader.card-of", { n: cur + 1, total })}: ${step.title} · ${P.title}`);
    store.touch(true);
    if (focus) focusEl(step.core.querySelector("h3"));
    else if (focus === false) { /* keep focus where it is */ }
  }
  function next() {
    if (stage === "quiz") return;
    if (cur === total - 1) startQuiz();
    else { showStep(cur + 1, true); window.scrollTo(0, 0); }
  }
  function prev() {
    if (stage === "quiz") { showStep(total - 1, true); return; }
    if (cur > 0) { showStep(cur - 1, true); window.scrollTo(0, 0); }
  }

  function openToc() {
    const list = h("ol", { class: "panel-lessons" });
    steps.forEach((s, i) => {
      const id = s.core.dataset.card;
      const title = $("h3", s.core)?.textContent.replace(/^.*?\d+\s*[^\s:]*:\s*/, "") || id;
      const mark = ls().seen[id] ? "✓ " : "";
      list.append(h("li", {}, h("button", { type: "button", class: "btn btn-ghost", "aria-current": i === cur && stage === "cards" ? "step" : null, onclick: () => { d.close(); if (store.getSettings().reading === "cards") { showStep(i, true); } else { s.core.scrollIntoView(); focusEl(s.core.querySelector("h3")); } } }, `${mark}${i + 1}. ${s.title}`)));
    });
    list.append(h("li", {}, h("button", { type: "button", class: "btn btn-ghost", onclick: () => { d.close(); startQuiz(); } }, t("reader.contents-quiz"))));
    const d = openDialog({ title: t("reader.contents"), body: list, returnFocus: tocBtn });
  }

  // ---- scroll mode --------------------------------------------------------------------------
  let io = null;
  function enableScroll() {
    steps.forEach((s) => s.els.forEach((el) => { el.hidden = false; }));
    $$(".lesson-section", bodyEl).forEach((sec) => { sec.hidden = false; });
    nav.hidden = true;
    io?.disconnect();
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target;
        if (e.isIntersecting) {
          el._t = setTimeout(() => { markSeen(el.dataset.card, "core"); io.unobserve(el); }, 1200);
        } else clearTimeout(el._t);
      }
    }, { threshold: 0.5 });
    cardEls.filter((el) => el.dataset.layer === "core" && !ls().seen[el.dataset.card]).forEach((el) => io.observe(el));
    prog.max = coreIds.length; prog.value = seenCount();
    countEl.textContent = t("reader.seen", { n: seenCount(), total: coreIds.length });
    secEl.textContent = "";
    setTitle(P.title);
  }

  function applyMode(focus) {
    const mode = store.getSettings().reading;
    article.classList.toggle("js-cards", mode === "cards");
    updateModeLabel();
    if (quizStarted) return;
    if (mode === "cards") { io?.disconnect(); showStep(cur, focus ? true : null); }
    else enableScroll();
    if (quizSection && mode === "scroll") { quizSection.hidden = false; renderQuizLauncher(); }
  }

  // ---- lesson test --------------------------------------------------------------------------
  let quizStarted = false;
  const quizHost = h("div", { class: "quiz-host" });
  function renderQuizLauncher() {
    if (!quizSection) return;
    quizHost.textContent = "";
    quizSection.append(quizHost);
    const q = P.quiz;
    const best = ls().quiz.best;
    quizHost.append(
      h("p", { text: t("quiz.intro", { n: q.length }) }),
      best ? h("p", { class: "small muted", text: t("quiz.best", { pct: pct(best), attempts: ls().quiz.attempts }) }) : null,
      h("div", { class: "btn-row" }, h("button", { type: "button", class: "btn btn-primary", onclick: () => startQuiz() }, t("quiz.start"))),
    );
  }

  function startQuiz(subset) {
    quizStarted = true;
    stage = "quiz";
    steps.forEach((s) => s.els.forEach((el) => { el.hidden = true; }));
    $$(".lesson-section", bodyEl).forEach((sec) => { sec.hidden = sec.id !== "quiz"; });
    quizSection.hidden = false;
    nav.hidden = true;
    io?.disconnect();
    const list = subset || P.quiz.map((q, i) => i);
    let qi = 0, correct = 0;
    const missed = [];
    const results = [];
    quizHost.textContent = "";
    quizSection.append(quizHost);
    const head = h("h3", { tabindex: "-1" });
    const wrap = h("div", { class: "quiz-run" });
    quizHost.append(head, wrap);
    secEl.textContent = t("lesson.quiz");
    setTitle(`${t("lesson.quiz")} · ${P.title}`);

    function showQ() {
      wrap.textContent = "";
      if (qi >= list.length) return finish();
      const idx = list[qi];
      const q = P.quiz[idx];
      head.textContent = t("quiz.q-of", { n: qi + 1, total: list.length });
      countEl.textContent = head.textContent;
      prog.max = list.length; prog.value = qi + 1;
      mountQuestion(wrap, q, {
        onAnswer: (res) => {
          const r = record(qkey(lessonId, q.id), res.ok, "quiz");
          if (res.ok) { correct++; if (r.firstRight) addXp(RULES.quizRight, "quiz"); }
          else missed.push(idx);
          results.push({ idx, ok: res.ok });
        },
        continueLabel: qi === list.length - 1 ? t("quiz.finish") : t("q.continue"),
        onContinue: () => { qi++; showQ(); },
      });
      focusEl(head);
    }
    function finish() {
      const l = ls();
      const score = correct / list.length;
      const full = list.length === P.quiz.length;
      if (full) {
        const before = l.quiz.best;
        l.quiz.attempts++; l.quiz.last = Date.now();
        if (score > before) l.quiz.best = score;
        if (score === 1 && before < 1) addXp(RULES.quizPerfect, "perfect");
      }
      store.touch();
      checkBadges();
      wrap.textContent = "";
      head.textContent = t("quiz.result");
      const nextLink = $(".pager a[rel=next]");
      wrap.append(
        h("p", { class: "lead", text: t("quiz.score", { correct, total: list.length, pct: pct(score) }) }),
        h("p", { text: score >= 0.8 ? t("quiz.good") : score >= 0.5 ? t("quiz.ok") : t("quiz.retry-hint") }),
        missed.length ? h("div", {}, h("h4", { text: t("quiz.missed") }), h("ul", {}, missed.map((i) => h("li", { text: P.quiz[i].prompt || P.quiz[i].scenario })))) : null,
        h("div", { class: "btn-row" },
          missed.length ? h("button", { type: "button", class: "btn btn-primary", onclick: () => startQuiz(missed) }, t("quiz.retry-missed")) : null,
          h("button", { type: "button", class: "btn", onclick: () => startQuiz() }, t("quiz.again")),
          h("button", { type: "button", class: "btn", onclick: () => { quizStarted = false; cur = 0; applyMode(true); window.scrollTo(0, 0); } }, t("quiz.back-to-cards")),
          nextLink ? h("a", { class: "btn", href: nextLink.href }, t("lesson.next")) : null),
      );
      announce(t("quiz.score", { correct, total: list.length, pct: pct(score) }));
      focusEl(head);
    }
    showQ();
  }

  // ---- go ----------------------------------------------------------------------------------
  const resumeAt = ls().done ? 0 : Math.min(ls().pos || 0, total - 1);
  cur = resumeAt;
  if (resumeAt > 0 && !ls().done) {
    const note = h("div", { class: "callout", role: "note" }, h("span", { text: t("reader.resume", { n: resumeAt + 1, total }) + " " }),
      h("button", { type: "button", class: "btn btn-ghost", onclick: () => { cur = 0; note.remove(); if (store.getSettings().reading === "cards") showStep(0, true); else window.scrollTo(0, 0); } }, t("reader.restart")));
    mount.after(note);
  }
  applyMode(false);
  if (!store.getSettings().reading || store.getSettings().reading === "cards") { /* ensure quiz launcher exists for JS scroll switch */ }
  renderQuizLauncher();
  if (store.getSettings().reading === "cards") quizSection.hidden = true;
  // keyboard shortcuts must not trigger while typing/choosing; we only offer buttons, no global keys.
}
