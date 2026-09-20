// Lesson page enhancement. The page is complete static text; this turns it into a card reader (one card per "page",
// or continuous scrolling), saves exactly where you stopped, and marks cards as read. Questions are NOT part of the
// lesson: they live in the separate Questions area, which serves them according to what you have read.
import { $, $$, h, toast, focusEl, setTitle } from "./dom.js";
import * as store from "./store.js";
import { t, base, langPath } from "./i18n.js";
import { RULES, addXp } from "./learn.js";
import { checkBadges } from "./xp.js";
import { setStudyContext } from "./time.js";
import { openDialog } from "./dialog.js";

export function initLesson() {
  const article = $("article.lesson[data-lesson]");
  if (!article) return;
  const lessonId = article.dataset.lesson, courseId = article.dataset.course;
  const bodyEl = $("#lesson-body");
  const cardEls = $$(".card", bodyEl);
  const title = $("h1", article)?.textContent.trim() || lessonId;
  const ls = () => store.lessonState(lessonId);
  setStudyContext(true);

  const st = store.get();
  st.last = { course: courseId, lesson: lessonId, ts: Date.now() };
  if (!ls().started) ls().started = Date.now();
  store.touch(true);

  // one step = one core card + the deep cards that follow it
  const steps = [];
  cardEls.forEach((el) => {
    if (el.dataset.layer === "core" || !steps.length) steps.push({ els: [el], core: el, title: (el.querySelector("h3")?.textContent || "").trim() });
    else steps.at(-1).els.push(el);
  });
  const coreIds = cardEls.filter((el) => el.dataset.layer === "core").map((el) => el.dataset.card);
  const total = steps.length;
  let cur = 0;
  let finished = false;
  const seenCount = () => coreIds.filter((id) => ls().seen[id]).length;

  function markSeen(id, layer) {
    const l = ls();
    if (l.seen[id]) return;
    l.seen[id] = Date.now();
    const s = store.get();
    if (layer === "deep") { s.counters.deep++; l.deep[id] = Date.now(); addXp(RULES.deep, "deep"); }
    else { s.counters.cards++; addXp(RULES.card, "card"); }
    store.streakTouch();
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
      toast(t("lesson.done.title"), t("lesson.done.msg", { title }));
      checkBadges();
    }
  }
  cardEls.forEach((el) => { if (el.dataset.layer === "deep") el.addEventListener("toggle", () => { if (el.open) markSeen(el.dataset.card, "deep"); }); });

  // ---- reader bar ---------------------------------------------------------------------------
  const secEl = h("span", { class: "small muted" });
  const countEl = h("span", { class: "small", "aria-hidden": "true" });
  const prog = h("progress", { max: total, value: 1, "aria-label": t("reader.progress") });
  const modeBtn = h("button", { type: "button", class: "btn btn-ghost", onclick: toggleMode });
  const tocBtn = h("button", { type: "button", class: "btn btn-ghost", onclick: openToc }, t("reader.contents"));
  $("#reader-mount").append(h("div", { class: "reader-bar", role: "region", "aria-label": t("reader.region") },
    h("div", { class: "row" }, secEl, countEl), prog, h("div", { class: "reader-controls" }, tocBtn, modeBtn)));
  const prevBtn = h("button", { type: "button", class: "btn", onclick: () => prev() }, `← ${t("reader.prev")}`);
  const nextBtn = h("button", { type: "button", class: "btn btn-primary", onclick: () => next() });
  const nav = h("div", { class: "reader-nav" }, prevBtn, nextBtn);
  const endBox = h("section", { class: "callout", hidden: true, "aria-labelledby": "end-h" });
  bodyEl.after(nav, endBox);

  const practiceUrl = () => `${base()}/${langPath()}/app/review/?lesson=${encodeURIComponent(lessonId)}`;
  function showEnd() {
    finished = true;
    steps.forEach((s) => s.els.forEach((el) => { el.hidden = true; }));
    $$(".lesson-section", bodyEl).forEach((sec) => { sec.hidden = true; });
    nav.hidden = true;
    const nextLink = $(".pager a[rel=next]");
    endBox.hidden = false;
    endBox.textContent = "";
    endBox.append(
      h("h2", { id: "end-h", tabindex: "-1", text: t("reader.end-title") }),
      h("p", { text: t("reader.end-msg") }),
      h("div", { class: "btn-row" },
        h("a", { class: "btn btn-primary", href: practiceUrl() }, t("lesson.practice")),
        nextLink ? h("a", { class: "btn", href: nextLink.href }, t("lesson.next")) : null,
        h("button", { type: "button", class: "btn", onclick: () => { finished = false; endBox.hidden = true; cur = 0; applyMode(true); window.scrollTo(0, 0); } }, t("reader.restart"))));
    secEl.textContent = t("reader.end-title");
    setTitle(`${t("reader.end-title")} · ${title}`);
    focusEl($("#end-h"));
  }

  const updateModeLabel = () => { modeBtn.textContent = store.getSettings().reading === "cards" ? t("reader.to-scroll") : t("reader.to-cards"); };
  function toggleMode() { store.setSetting("reading", store.getSettings().reading === "cards" ? "scroll" : "cards"); applyMode(true); }

  function decorateHeading(step, i) {
    const hd = step.core.querySelector("h3");
    if (!hd) return;
    let sr = hd.querySelector(".sr-only");
    if (!sr) { sr = h("span", { class: "sr-only" }); hd.prepend(sr); }
    sr.textContent = t("reader.card-of", { n: i + 1, total }) + " ";
  }

  function showStep(i, focus) {
    finished = false; endBox.hidden = true;
    cur = Math.max(0, Math.min(total - 1, i));
    ls().pos = cur;
    steps.forEach((s, j) => s.els.forEach((el) => { el.hidden = j !== cur; }));
    $$(".lesson-section", bodyEl).forEach((sec) => { sec.hidden = !sec.querySelector(".card:not([hidden])"); });
    const step = steps[cur];
    decorateHeading(step, cur);
    markSeen(step.core.dataset.card, step.core.dataset.layer === "deep" ? "deep" : "core");
    secEl.textContent = t("section." + step.core.dataset.section);
    countEl.textContent = t("reader.count", { n: cur + 1, total });
    prog.max = total; prog.value = cur + 1;
    prog.setAttribute("aria-valuetext", t("reader.card-of", { n: cur + 1, total }));
    prevBtn.disabled = cur === 0;
    nextBtn.textContent = cur === total - 1 ? t("reader.finish") : `${t("reader.next")} →`;
    nav.hidden = false;
    setTitle(`${t("reader.card-of", { n: cur + 1, total })}: ${step.title} · ${title}`);
    store.touch(true);
    if (focus) focusEl(step.core.querySelector("h3"));
  }
  function next() { if (cur === total - 1) { markSeen(steps[cur].core.dataset.card, "core"); showEnd(); } else { showStep(cur + 1, true); window.scrollTo(0, 0); } }
  function prev() { if (finished) { showStep(total - 1, true); return; } if (cur > 0) { showStep(cur - 1, true); window.scrollTo(0, 0); } }

  function openToc() {
    const list = h("ol", { class: "panel-lessons" });
    steps.forEach((s, i) => {
      const mark = ls().seen[s.core.dataset.card] ? "✓ " : "";
      list.append(h("li", {}, h("button", { type: "button", class: "btn btn-ghost", "aria-current": i === cur ? "step" : null, onclick: () => {
        d.close();
        if (store.getSettings().reading === "cards") showStep(i, true); else { s.core.scrollIntoView(); focusEl(s.core.querySelector("h3")); }
      } }, `${mark}${i + 1}. ${s.title}`)));
    });
    const d = openDialog({ title: t("reader.contents"), body: list, returnFocus: tocBtn });
  }

  let io = null;
  function enableScroll() {
    finished = false; endBox.hidden = true;
    steps.forEach((s) => s.els.forEach((el) => { el.hidden = false; }));
    $$(".lesson-section", bodyEl).forEach((sec) => { sec.hidden = false; });
    nav.hidden = true;
    io?.disconnect();
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target;
        if (e.isIntersecting) el._t = setTimeout(() => { markSeen(el.dataset.card, "core"); io.unobserve(el); }, 1200);
        else clearTimeout(el._t);
      }
    }, { threshold: 0.5 });
    cardEls.filter((el) => el.dataset.layer === "core" && !ls().seen[el.dataset.card]).forEach((el) => io.observe(el));
    prog.max = coreIds.length; prog.value = seenCount();
    countEl.textContent = t("reader.seen", { n: seenCount(), total: coreIds.length });
    secEl.textContent = "";
    setTitle(title);
  }
  function applyMode(focus) {
    const mode = store.getSettings().reading;
    article.classList.toggle("js-cards", mode === "cards");
    updateModeLabel();
    if (mode === "cards") { io?.disconnect(); showStep(cur, focus ? true : null); } else enableScroll();
  }

  // resume exactly where the reader stopped
  const resumeAt = ls().done ? 0 : Math.min(ls().pos || 0, total - 1);
  cur = resumeAt;
  if (resumeAt > 0 && !ls().done) {
    const note = h("div", { class: "callout", role: "note" }, h("span", { text: t("reader.resume", { n: resumeAt + 1, total }) + " " }),
      h("button", { type: "button", class: "btn btn-ghost", onclick: () => { cur = 0; note.remove(); if (store.getSettings().reading === "cards") showStep(0, true); else window.scrollTo(0, 0); } }, t("reader.restart")));
    $("#reader-mount").after(note);
  }
  applyMode(false);
}
