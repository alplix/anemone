// "Study" dashboard: continue, daily goal, streak, due reviews, level and badges, weak topics.
import { h } from "./dom.js";
import * as store from "./store.js";
import { t, num, pct, dur } from "./i18n.js";
import { loadCourses, computeStats, acc, MIN_ANSWERS } from "./pool.js";
import { continueTarget } from "./map.js";
import { dueKeys, openMistakes } from "./learn.js";
import { progressToNext, rankName, BADGES } from "./xp.js";
import { todayStudy } from "./time.js";
import { setStudyContext } from "./time.js";

const sec = (id, title, ...kids) => h("section", { "aria-labelledby": id }, h("h2", { id, text: title }), ...kids);

export async function renderStudy(root) {
  setStudyContext(false);
  const courses = await loadCourses();
  const course = courses[0];
  const s = store.get(), set = store.getSettings();
  root.textContent = "";

  // continue
  const target = course && continueTarget(course);
  root.append(sec("st-continue", t("study.continue"),
    target
      ? h("p", {}, h("a", { class: "btn btn-primary", href: target.lesson.url }, target.resumed && target.pos > 0 ? t("continue.card", { title: target.lesson.title, n: target.pos + 1 }) : target.resumed ? t("continue.lesson", { title: target.lesson.title }) : t("continue.start", { title: target.lesson.title })))
      : h("p", { text: t("study.nothing-to-continue") }),
    h("p", {}, h("a", { href: course?.url || "#", text: t("study.open-map") }))));

  // today
  const goal = set.goalMin * 60, done = todayStudy();
  const streak = store.streakNow();
  root.append(sec("st-today", t("study.today"),
    h("p", { text: t("study.goal-line", { done: dur(done), goal: dur(goal) }) }),
    h("progress", { max: goal, value: Math.min(done, goal), "aria-label": t("study.goal-bar") }),
    h("p", { text: t("study.streak-line", { n: num(streak), best: num(s.streak.best) }) })));

  // reviews
  const due = dueKeys().length, mistakes = openMistakes().length;
  root.append(sec("st-review", t("study.review"),
    h("p", { text: t("study.review-line", { due: num(due), mistakes: num(mistakes) }) }),
    h("div", { class: "btn-row" }, h("a", { class: "btn", href: "../review/" }, t("study.review-go")), h("a", { class: "btn", href: "../exam/" }, t("study.exams-go")), h("a", { class: "btn btn-ghost", href: "../account/" }, t("study.account-go")))));

  // level
  const p = progressToNext(s.xp);
  root.append(sec("st-level", t("study.level"),
    h("div", { class: "xpbar" },
      h("p", { text: t("study.level-line", { level: p.level, rank: rankName(p.level), xp: num(s.xp) }) }),
      h("progress", { max: p.span, value: p.into, "aria-label": t("study.xp-bar") }),
      h("p", { class: "small muted", text: t("study.xp-next", { n: num(p.next - s.xp), level: p.level + 1 }) }))));

  // unit progress + weak topics
  const st = computeStats(courses);
  const weak = Object.values(st.byLesson).filter((l) => l.r + l.w >= MIN_ANSWERS && acc(l) < 0.7).sort((a, b) => acc(a) - acc(b)).slice(0, 3);
  root.append(sec("st-weak", t("study.weak"),
    weak.length ? h("ul", {}, weak.map((l) => h("li", {}, h("a", { href: l.url, text: l.title }), ` — ${pct(acc(l))} (${t("stats.answers", { n: l.r + l.w })})`))) : h("p", { text: t("study.weak-none", { min: MIN_ANSWERS }) })));

  const units = Object.values(st.byUnit).filter((u) => u.ready);
  if (units.length) root.append(sec("st-units", t("study.units"), h("ul", {}, units.map((u) => h("li", { text: `${u.title}: ${t("map.unit-progress", { done: u.done, total: u.ready })}` })))));

  // badges
  const earned = Object.keys(BADGES).filter((b) => s.badges[b]);
  root.append(sec("st-badges", t("study.badges", { n: earned.length, total: Object.keys(BADGES).length }),
    h("ul", {}, Object.keys(BADGES).map((b) => h("li", { text: s.badges[b] ? `✓ ${t("badge." + b + ".name")} — ${t("badge." + b + ".desc")}` : `${t("badge.locked")} ${t("badge." + b + ".name")} — ${t("badge." + b + ".desc")}` })))));
}
