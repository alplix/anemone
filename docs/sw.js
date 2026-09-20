/* Anemone service worker. Version, base path and the pre-cache list are filled in by scripts/build.mjs.
   Pages: network first, cached copy when offline. Assets and data: cache first, refreshed in the background. */
const VERSION = "fe1c3fed7d";
const BASE = "/anemone";
const PRECACHE = ["/anemone/assets/css/site.css?v=0fb9d679f7","/anemone/assets/js/account.js","/anemone/assets/js/api.js","/anemone/assets/js/app.js?v=107607bd75","/anemone/assets/js/dialog.js","/anemone/assets/js/dom.js","/anemone/assets/js/exam.js","/anemone/assets/js/i18n.js","/anemone/assets/js/leaderboard.js","/anemone/assets/js/learn.js","/anemone/assets/js/lesson.js","/anemone/assets/js/map.js","/anemone/assets/js/panel.js","/anemone/assets/js/pool.js","/anemone/assets/js/questions.js","/anemone/assets/js/review.js","/anemone/assets/js/settings.js","/anemone/assets/js/stats.js","/anemone/assets/js/store.js","/anemone/assets/js/study.js","/anemone/assets/js/time.js","/anemone/assets/js/tips.js","/anemone/assets/js/xp.js","/anemone/assets/icon.svg"];
const CACHE = "anemone-" + VERSION;
const KEEP = ["anemone-offline-pack"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("anemone-") && k !== CACHE && !KEEP.includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(BASE + "/")) return;
  const isPage = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (isPage) {
    e.respondWith(
      fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match(BASE + "/index.html") || new Response("<!doctype html><meta charset=utf-8><title>Offline</title><p>You are offline and this page has not been saved yet.</p>", { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 })))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; }).catch(() => hit);
      return hit || net;
    })
  );
});
