// Small DOM helpers shared by every module (no framework).
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k === "html") el.innerHTML = v;
    else if (k === "dataset") Object.assign(el.dataset, v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

let liveTimer;
/** Polite announcement for screen readers (the live region is rendered by every page). */
export function announce(msg) {
  const el = $("#anemone-live");
  if (!el) return;
  el.textContent = "";
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => { el.textContent = msg; }, 60);
}
export function alertMsg(msg) {
  const el = $("#anemone-alert");
  if (!el) return;
  el.textContent = "";
  setTimeout(() => { el.textContent = msg; }, 60);
}

/** Visible toast + the same text announced politely. */
export function toast(title, msg, ms = 6000) {
  const box = $("#anemone-toasts");
  if (box) {
    const el = h("div", { class: "toast" }, h("span", { class: "toast-title", text: title }), msg);
    box.append(el);
    setTimeout(() => el.remove(), ms);
  }
  announce(msg ? `${title}. ${msg}` : title);
}

export function shuffle(arr, rand = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/** Small deterministic PRNG so "random of the day" is stable for a given key. */
export function seeded(seed) {
  let s = 0;
  for (const ch of String(seed)) s = (Math.imul(s, 31) + ch.charCodeAt(0)) | 0;
  return () => { s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 13), 3266489909); t ^= t >>> 16; return (t >>> 0) / 4294967296; };
}
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function todayStr(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function addDays(str, n) {
  const [y, m, d] = str.split("-").map(Number);
  return todayStr(new Date(y, m - 1, d + n));
}

export function focusEl(el) {
  if (!el) return;
  if (!el.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(el.tagName)) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: false });
}

export function setTitle(title) {
  const site = document.title.split(" | ").pop();
  document.title = `${title} | ${site}`;
}

/** Scrollable table wrapper that is keyboard reachable and named (WCAG: scrollable regions must be focusable). */
export function tableWrap(caption, table) {
  return h("div", { class: "table-wrap", tabindex: "0", role: "region", "aria-label": caption }, table);
}
