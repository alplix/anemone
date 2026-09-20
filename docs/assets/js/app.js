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
  await pullOnce();
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
  const sel = $("#theme-select");
  const cur = () => (THEMES.includes(store.getSettings().theme) ? store.getSettings().theme : "console");
  if (sel) {
    sel.value = cur();
    sel.addEventListener("change", () => {
      store.setSetting("theme", sel.value);
      applySettings();
      announce(t("theme.now", { name: t("theme." + sel.value) }));
    });
  }
  const label = () => { if (sel && sel.value !== cur()) sel.value = cur(); };
  $("#lang-select")?.addEventListener("change", (e) => { location.href = e.target.value; });
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

// Progress lives in the database when the reader is signed in (the browser copy is only a cache); guests keep it in this browser.
const syncEl = () => $("#sync-state");
const setSync = (key) => { const el = syncEl(); if (el) el.textContent = key ? t(key) : ""; };

async function pullOnce() {
  try {
    if (sessionStorage.getItem("anemone.pulled")) return;
    const api = await import("./api.js");
    if (!api.enabled() || !api.getAuth()) return;
    sessionStorage.setItem("anemone.pulled", "1");
    await Promise.race([api.pullAndMerge(), new Promise((_, no) => setTimeout(no, 4000))]);
  } catch { /* offline or slow: the browser copy is used and pushed later */ }
}

async function startSync() {
  const api = await import("./api.js");
  if (!api.enabled()) return;
  if (!api.getAuth()) { setSync("sync.guest"); return; }
  const acc = await import("./account.js");
  let dirty = false, timer = null;
  const later = (ms) => { clearTimeout(timer); timer = setTimeout(() => push(false), ms); };
  const push = async (keepalive) => {
    if (!dirty) return;
    try {
      const r = await api.pushNow(await acc.courseOfLesson(), { keepalive });
      if (r.skipped) { later(25000); return; }
      dirty = false; setSync("sync.saved");
    } catch { setSync("sync.failed"); later(45000); }
  };
  store.on((what) => {
    if (what !== "state") return;
    dirty = true; setSync("sync.pending");
    later(30000);
  });
  setSync("sync.saved");
  setInterval(() => { if (document.visibilityState === "visible") push(false); }, 60000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") push(true); });
  addEventListener("pagehide", () => push(true));
}

function registerWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;
  navigator.serviceWorker.register(`${base()}/sw.js`, { scope: `${base()}/` }).catch(() => { /* offline support is optional */ });
}

main().catch((e) => console.error(e));
