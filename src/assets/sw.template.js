/* Anemone service worker. Version, base path and the pre-cache list are filled in by scripts/build.mjs.
   Pages: network first, cached copy when offline. Assets and data: cache first, refreshed in the background. */
const VERSION = "__VERSION__";
const BASE = "__BASE__";
const PRECACHE = __PRECACHE__;
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
