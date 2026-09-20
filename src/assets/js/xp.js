// XP, levels, ranks and badges. All names come from the interface strings so they translate.
import * as store from "./store.js";
import { toast } from "./dom.js";
import { t } from "./i18n.js";

export const RULES = { card: 2, deep: 3, miniFirst: 5, miniLater: 2, lessonDone: 30, quizRight: 2, quizPerfect: 20, review: 3, examRight: 1, boss: 50, goal: 25, badge: 20 };

// level n starts at 100 * n * (n - 1) / 2 xp:  L1 0, L2 100, L3 300, L4 600 ...
export const xpForLevel = (n) => 50 * n * (n - 1);
export function levelFor(xp) {
  let n = 1;
  while (xp >= xpForLevel(n + 1)) n++;
  return n;
}
const RANK_AT = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55];
export function rankIndex(level) {
  let r = 0;
  RANK_AT.forEach((l, i) => { if (level >= l) r = i; });
  return r;
}
export const rankName = (level) => t("rank." + rankIndex(level));
export function progressToNext(xp) {
  const lv = levelFor(xp), a = xpForLevel(lv), b = xpForLevel(lv + 1);
  return { level: lv, into: xp - a, span: b - a, next: b, pct: (xp - a) / (b - a) };
}

export function addXp(n, reason, course) {
  if (!n) return;
  const s = store.get();
  const c = course || document.body?.dataset.course || s.last?.course;
  if (c && /^[a-z0-9-]{1,64}$/.test(c)) s.xpc[c] = (s.xpc[c] || 0) + n;
  const before = levelFor(s.xp);
  s.xp += n;
  const after = levelFor(s.xp);
  store.touch();
  if (after > before) toast(t("xp.levelup.title"), t("xp.levelup.msg", { level: after, rank: rankName(after) }));
  return n;
}

export const BADGES = {
  "first-card": (s) => s.counters.cards >= 1,
  "first-lesson": (s) => Object.values(s.progress.lessons).some((l) => l.done),
  "sharp": (s) => s.counters.right >= 25,
  "perfect-quiz": (s) => Object.values(s.progress.lessons).some((l) => l.quiz.best >= 1),
  "streak-3": (s) => s.streak.best >= 3,
  "streak-7": (s) => s.streak.best >= 7,
  "streak-30": (s) => s.streak.best >= 30,
  "hours-1": (s) => totalStudy(s) >= 3600,
  "hours-10": (s) => totalStudy(s) >= 36000,
  "deep-diver": (s) => s.counters.deep >= 10,
  "reviewer": (s) => s.counters.reviews >= 25,
  "exam-first": (s) => s.exams.length >= 1,
  "exam-80": (s) => s.exams.some((e) => e.total && e.score / e.total >= 0.8),
  "curious": (s) => s.counters.panels >= 10,
  "goal-getter": (s) => Object.values(s.goalDays).filter(Boolean).length >= 5,
};
const totalStudy = (s) => Object.values(s.time.days).reduce((a, d) => a + d.study, 0);

/** Award every badge whose condition is now true; announces each one in words. */
export function checkBadges() {
  const s = store.get();
  let any = false;
  for (const [id, cond] of Object.entries(BADGES)) {
    if (s.badges[id] || !cond(s)) continue;
    s.badges[id] = Date.now();
    any = true;
    toast(t("badge.new"), `${t("badge." + id + ".name")}: ${t("badge." + id + ".desc")}`);
    s.xp += RULES.badge;
  }
  if (any) store.touch();
}
