// Time on task. Two clocks are kept apart on purpose:
//   app   = the tab is visible and the app is open;
//   study = the reader / review / exam is open AND the user did something in the last 60 seconds
//           (idle time and background tabs are never counted).
import * as store from "./store.js";
import { todayStr } from "./dom.js";
import { addXp, RULES, checkBadges } from "./xp.js";
import { toast } from "./dom.js";
import { t } from "./i18n.js";

const IDLE_MS = 60000;
let lastAct = Date.now();
let studyPage = false;
let timer = null;

export function setStudyContext(on) { studyPage = !!on; }
export function poke() { lastAct = Date.now(); }

export function start() {
  ["pointerdown", "keydown", "scroll", "touchstart", "wheel", "input", "focusin"].forEach((ev) => window.addEventListener(ev, poke, { passive: true, capture: true }));
  if (timer) return;
  timer = setInterval(tick, 1000);
}

function tick() {
  if (document.visibilityState !== "visible") return;
  const s = store.get();
  const day = todayStr();
  const d = (s.time.days[day] ||= { app: 0, study: 0 });
  d.app += 1;
  if (studyPage && Date.now() - lastAct < IDLE_MS) {
    d.study += 1;
    s.time.hours[new Date().getHours()] += 1;
    if (d.study === 120) { if (store.streakTouch(day)) store.touch(true); }
    const goal = store.getSettings().goalMin * 60;
    if (d.study >= goal && !s.goalDays[day]) {
      s.goalDays[day] = true;
      addXp(RULES.goal, "goal");
      toast(t("goal.reached.title"), t("goal.reached.msg", { min: store.getSettings().goalMin }));
      checkBadges();
    }
  }
  if (d.app % 10 === 0) store.touch(true);
}

export const todayStudy = () => store.get().time.days[todayStr()]?.study || 0;
export const todayApp = () => store.get().time.days[todayStr()]?.app || 0;
