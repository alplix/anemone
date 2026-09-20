// User settings: theme, text size, line spacing, dyslexia-friendly type, motion, reading mode, goals, tips,
// save-file export/import and offline download. Applied through attributes on <html> (see also the tiny
// inline script in every page head, which applies them before first paint).
import { h, toast, announce } from "./dom.js";
import * as store from "./store.js";
import { t, getJson, base, langPath } from "./i18n.js";
import { confirmDialog } from "./dialog.js";

export function applySettings() {
  const s = store.getSettings();
  const d = document.documentElement;
  if (s.theme && s.theme !== "auto") d.setAttribute("data-theme", s.theme); else d.removeAttribute("data-theme");
  d.style.setProperty("--fs", s.fs);
  d.style.setProperty("--lh", s.lh);
  if (s.dyslexia) d.setAttribute("data-dyslexia", "1"); else d.removeAttribute("data-dyslexia");
  if (s.motion === "reduce") d.setAttribute("data-motion", "reduce"); else d.removeAttribute("data-motion");
}

function radioGroup(name, legend, options, current, onChange, hint) {
  const fs = h("fieldset", {}, h("legend", { text: legend }), hint ? h("p", { class: "small muted", text: hint }) : null);
  const wrap = h("div", { class: "q-options" });
  options.forEach(([value, label]) => {
    const id = `${name}-${value}`;
    const input = h("input", { type: "radio", name, id, value, checked: String(current) === String(value) ? true : null, onchange: () => onChange(value) });
    wrap.append(h("label", { class: "choice", for: id }, input, h("span", { text: label })));
  });
  fs.append(wrap);
  return fs;
}

export function renderSettings(root) {
  const s = store.getSettings();
  const upd = (key, conv = (v) => v) => (v) => { store.setSetting(key, conv(v)); applySettings(); announce(t("settings.saved")); };
  root.textContent = "";
  root.append(
    h("p", { class: "lead", text: t("settings.intro") }),
    radioGroup("theme", t("settings.theme"), [
      ["auto", t("theme.auto")], ["light", t("theme.light")], ["dark", t("theme.dark")], ["sepia", t("theme.sepia")],
      ["contrast", t("theme.contrast")], ["cvd", t("theme.cvd")], ["paper", t("theme.paper")],
    ], s.theme, upd("theme"), t("settings.theme-hint")),
    radioGroup("fs", t("settings.fs"), [["0.9", "90%"], ["1", "100%"], ["1.15", "115%"], ["1.3", "130%"], ["1.5", "150%"], ["1.75", "175%"]], s.fs, upd("fs")),
    radioGroup("lh", t("settings.lh"), [["1.4", t("lh.tight")], ["1.6", t("lh.normal")], ["1.8", t("lh.relaxed")], ["2", t("lh.wide")]], s.lh, upd("lh")),
    radioGroup("dys", t("settings.dyslexia"), [["0", t("common.off")], ["1", t("common.on")]], s.dyslexia ? "1" : "0", upd("dyslexia", (v) => v === "1"), t("settings.dyslexia-hint")),
    radioGroup("motion", t("settings.motion"), [["auto", t("motion.auto")], ["reduce", t("motion.reduce")]], s.motion, upd("motion"), t("settings.motion-hint")),
    radioGroup("reading", t("settings.reading"), [["cards", t("reading.cards")], ["scroll", t("reading.scroll")]], s.reading, upd("reading"), t("settings.reading-hint")),
    radioGroup("goal", t("settings.goal"), [5, 10, 15, 20, 30, 45, 60, 90].map((m) => [String(m), t("settings.goal-min", { m })]), String(s.goalMin), upd("goalMin", Number)),
    radioGroup("tip", t("settings.tip"), [["off", t("tip.off")], ["visit", t("tip.visit")], ["daily", t("tip.daily")], ["weekly", t("tip.weekly")]], s.tip, upd("tip"), t("settings.tip-hint")),
    dataSection(),
    offlineSection(),
  );
}

function download(name, text, type = "application/json") {
  const blob = new Blob([text], { type });
  const a = h("a", { href: URL.createObjectURL(blob), download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function dataSection() {
  const status = h("p", { role: "status", class: "small" });
  const file = h("input", { type: "file", accept: "application/json,.json", id: "import-file", class: "sr-only", "aria-label": t("save.import"), tabindex: "-1", onchange: async () => {
    const f = file.files[0]; if (!f) return;
    if (f.size > 4e6) { status.textContent = t("save.too-big"); return; }
    const text = await f.text();
    const replace = await confirmDialog({ title: t("save.import-title"), message: t("save.import-msg"), confirmLabel: t("save.replace"), cancelLabel: t("save.merge") });
    const r = store.importSave(text, replace ? "replace" : "merge");
    status.textContent = r.ok ? t("save.imported") : t("save.bad-file");
    if (r.ok) { applySettings(); toast(t("save.imported"), ""); }
    file.value = "";
  } });
  return h("fieldset", {},
    h("legend", { text: t("save.title") }),
    h("p", { text: t("save.intro") }),
    store.isMemoryOnly() ? h("p", { class: "notice", text: t("save.memory-only") }) : null,
    h("div", { class: "btn-row" },
      h("button", { type: "button", class: "btn", onclick: () => { download(`anemone-save-${new Date().toISOString().slice(0, 10)}.json`, store.exportSave()); status.textContent = t("save.exported"); } }, t("save.export")),
      h("button", { type: "button", class: "btn", onclick: () => file.click() }, t("save.import")),
      h("button", { type: "button", class: "btn btn-ghost", onclick: async () => { if (await confirmDialog({ title: t("save.reset-title"), message: t("save.reset-msg"), confirmLabel: t("save.reset") })) { store.reset(); status.textContent = t("save.reset-done"); } } }, t("save.reset"))),
    file, status);
}

function offlineSection() {
  const status = h("p", { role: "status", class: "small" });
  const btn = h("button", { type: "button", class: "btn", onclick: async () => {
    if (!("caches" in window) || !navigator.serviceWorker) { status.textContent = t("offline.unsupported"); return; }
    btn.disabled = true; status.textContent = t("offline.working");
    try {
      const course = await getJson("course-mass-communication-theories.json");
      const urls = new Set();
      course.units.forEach((u) => u.lessons.forEach((l) => { if (l.status === "ready") { urls.add(l.url); urls.add(`${base()}/data/${langPath()}/mass-communication-theories/q/${l.id}.json`); } }));
      urls.add(course.url); urls.add(`${base()}/data/${langPath()}/ui.json`); urls.add(`${base()}/data/${langPath()}/course-${course.id}.json`);
      const cache = await caches.open("anemone-offline-pack");
      let n = 0;
      for (const u of urls) { try { const r = await fetch(u, { cache: "reload" }); if (r.ok) { await cache.put(u, r); n++; } } catch { /* skip */ } }
      status.textContent = t("offline.done", { n });
    } catch { status.textContent = t("offline.failed"); }
    btn.disabled = false;
  } }, t("offline.button"));
  return h("fieldset", {}, h("legend", { text: t("offline.title") }), h("p", { text: t("offline.intro") }), h("div", { class: "btn-row" }, btn), status);
}
