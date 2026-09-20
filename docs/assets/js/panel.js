// Person / concept panel. Without JavaScript the same references are plain links to the person / concept pages.
// With JavaScript a click (or Enter) opens a small dialog fed from data/<lang>/people|concepts/<id>.json.
import { h } from "./dom.js";
import { getJson, t } from "./i18n.js";
import { openDialog, dialogSupported } from "./dialog.js";
import * as store from "./store.js";
import { checkBadges } from "./xp.js";

let current = null;

export function initPanel() {
  if (!dialogSupported()) return;
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.("a.ref[data-ref]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    // links inside the reference lists of the entity's own page keep navigating normally
    const [kind, id] = a.dataset.ref.split(":");
    if (!/^(person|concept)$/.test(kind)) return;
    e.preventDefault();
    openRef(kind, id, a);
  });
}

async function openRef(kind, id, opener) {
  const folder = kind === "person" ? "people" : "concepts";
  const body = h("div", {}, h("p", { text: t("panel.loading") }));
  const inside = current && current.dialog.open;
  const d = inside ? current : openDialog({ title: t("panel.loading"), body, returnFocus: opener });
  if (inside) { d.body.textContent = ""; d.body.append(body); }
  current = d;
  d.dialog.addEventListener("close", () => { if (current === d) current = null; }, { once: true });
  try {
    const j = await getJson(`${folder}/${id}.json`);
    d.setTitle(j.name);
    body.textContent = "";
    body.append(
      j.lifespan ? h("p", { class: "muted", text: [j.lifespan, ...(j.roles || [])].join(" · ") }) : null,
      h("p", { class: "lead", text: j.short }),
      h("div", { html: j.html }),
      j.example ? h("div", {}, h("h3", { text: t("panel.example") }), h("div", { html: j.example })) : null,
      j.inCourse ? h("div", {}, h("h3", { text: t("panel.in-course") }), h("div", { html: j.inCourse })) : null,
      j.works?.length ? h("div", {}, h("h3", { text: t("panel.works") }), h("ul", {}, j.works.map((w) => h("li", { html: w })))) : null,
      j.lessons?.length ? h("div", {}, h("h3", { text: t("panel.lessons") }), h("ul", { class: "panel-lessons" }, j.lessons.map((l) => h("li", {}, h("a", { href: l.url, text: l.title }))))) : null,
      h("p", {}, h("a", { class: "btn", href: j.url }, t("panel.open-page"))),
    );
    const s = store.get(); s.counters.panels++; store.touch(true); checkBadges();
  } catch {
    d.setTitle(t("panel.error-title"));
    body.textContent = "";
    body.append(h("p", { text: t("panel.error") }));
  }
}
