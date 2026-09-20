// Interface strings for the JavaScript layer. The static HTML is already localised by the build; this file
// only serves the strings the game layer creates at runtime. Missing keys fall back to English at build time.
let ui = {};
const cache = new Map();

export const body = () => document.body;
export const langCode = () => document.body.dataset.lang || "en";
export const langPath = () => document.body.dataset.langPath || "en";
export const base = () => document.body.dataset.base || "";

export async function loadUi() {
  try {
    const r = await fetch(`${base()}/data/${langPath()}/ui.json`);
    ui = await r.json();
  } catch { ui = {}; }
}

export function t(key, params) {
  let s = key in ui ? ui[key] : key;
  if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m));
  return s;
}

export async function getJson(path) {
  const url = /^https?:|^\//.test(path) ? path : `${base()}/data/${langPath()}/${path}`;
  if (cache.has(url)) return cache.get(url);
  const p = fetch(url).then((r) => { if (!r.ok) throw new Error(`${r.status} ${url}`); return r.json(); });
  cache.set(url, p);
  p.catch(() => cache.delete(url));
  return p;
}

export const num = (n, opts) => new Intl.NumberFormat(langCode(), opts).format(n);
export const pct = (v) => new Intl.NumberFormat(langCode(), { style: "percent", maximumFractionDigits: 0 }).format(v);
export const dateLong = (s) => { try { return new Intl.DateTimeFormat(langCode(), { dateStyle: "medium" }).format(new Date(s + "T12:00:00")); } catch { return s; } };

/** 3725 seconds -> "1 h 2 min" (localised keys). */
export function dur(sec) {
  sec = Math.max(0, Math.round(sec));
  const hh = Math.floor(sec / 3600), mm = Math.floor((sec % 3600) / 60);
  if (hh) return t("time.h-min", { h: num(hh), m: num(mm) });
  if (mm) return t("time.min", { m: num(mm) });
  return t("time.sec", { s: num(sec) });
}
