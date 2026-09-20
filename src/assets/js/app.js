// Entry point: settings, translations, service worker, then whatever the current page needs.
import { $ } from "./dom.js";
import * as store from "./store.js";
import { loadUi, base } from "./i18n.js";
import { applySettings, renderSettings } from "./settings.js";
import * as time from "./time.js";
import { initPanel } from "./panel.js";

async function main() {
  store.load();
  applySettings();
  store.on((what) => { if (what === "settings") applySettings(); });
  await loadUi();
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
