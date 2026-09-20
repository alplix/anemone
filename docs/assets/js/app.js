// Entry point: settings, translations, service worker, then whatever the current page needs.
import { $ } from "./dom.js";
import * as store from "./store.js";
import { loadUi, base } from "./i18n.js";
import { applySettings, renderSettings } from "./settings.js";
import * as time from "./time.js";
import { initPanel } from "./panel.js";
import { progressToNext, rankName } from "./xp.js";
import { t } from "./i18n.js";
import { announce } from "./dom.js";

async function main() {
  store.load();
  applySettings();
  store.on((what) => { if (what === "settings") applySettings(); });
  await loadUi();
  initChrome();
  time.start();
  initPanel();
  registerWorker();
  startSync();

  const page = document.body.dataset.page;
  if (page === "lesson") { await (await import("./lesson.js")).initLesson(); }
  else if (page === "course") { const m = await import("./map.js"); m.decorateMap(); m.decorateContinue(); }
  else if (page === "home") { const m = await import("./map.js"); m.decorateContinue(); (await import("./tips.js")).initTip(); }
  else if (page === "lesson-stub") { /* nothing to enhance */ }
  else if (page === "app") {
    const root = $("#app-root");
    const view = root?.dataset.view;
    try {
      if (view === "settings") renderSettings(root);
      else if (view === "study") await (await import("./study.js")).renderStudy(root);
      else if (view === "stats") await (await import("./stats.js")).renderStats(root);
      else if (view === "review") await (await import("./review.js")).renderReview(root);
      else if (view === "exam") await (await import("./exam.js")).renderExam(root);
      else if (view === "account") await (await import("./account.js")).renderAccount(root);
      else if (view === "leaderboard") await (await import("./leaderboard.js")).renderLeaderboard(root);
      else if (view === "profile") await (await import("./leaderboard.js")).renderProfile(root);
    } catch (e) { console.error(e); root.textContent = String(e.message || e); }
  }
}

const THEMES = ["console", "terminal", "amber", "ice", "light", "sepia", "cvd", "contrast", "paper"];

// theme cycle button and the status line (level, XP, streak) that replace a menu
function initChrome() {
  const btn = $("#theme-cycle"), name = $("#theme-name");
  const cur = () => (THEMES.includes(store.getSettings().theme) ? store.getSettings().theme : "console");
  const label = () => { if (name) name.textContent = t("theme." + cur()); };
  label();
  btn?.addEventListener("click", () => {
    const next = THEMES[(THEMES.indexOf(cur()) + 1) % THEMES.length];
    store.setSetting("theme", next);
    applySettings(); label();
    announce(t("theme.now", { name: t("theme." + next) }));
  });
  store.on((what) => { if (what === "settings") label(); });
  const hud = $("#hud a");
  const draw = () => {
    if (!hud) return;
    const s = store.get(), p = progressToNext(s.xp);
    hud.textContent = t("hud.line", { level: p.level, rank: rankName(p.level), xp: Math.round(s.xp), streak: store.streakNow() });
  };
  draw();
  let tm; store.on((what) => { if (what === "state") { clearTimeout(tm); tm = setTimeout(draw, 400); } });
}

// optional cloud sync (only when an account service is configured AND the user signed in)
async function startSync() {
  const api = await import("./api.js");
  if (!api.enabled() || !api.getAuth()) return;
  const acc = await import("./account.js");
  const push = async (keepalive) => { try { await api.pushNow(await acc.courseOfLesson(), { keepalive }); } catch { /* try later */ } };
  setTimeout(() => push(false), 15000);
  setInterval(() => { if (document.visibilityState === "visible") push(false); }, 180000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") push(true); });
}

function registerWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;
  navigator.serviceWorker.register(`${base()}/sw.js`, { scope: `${base()}/` }).catch(() => { /* offline support is optional */ });
}

main().catch((e) => console.error(e));
