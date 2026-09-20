// Optional "tip of the day + mini test" on the home page. Off by default; frequency is a user setting.
// (Real push notifications need a server; this is an in-app card shown when the app is opened.)
import { $, h, seeded, todayStr } from "./dom.js";
import * as store from "./store.js";
import { t, getJson } from "./i18n.js";
import { payload, questionsOf } from "./pool.js";
import { mountQuestion } from "./questions.js";
import { record, addXp, RULES } from "./learn.js";

const weekKey = () => { const d = new Date(); const y = new Date(d.getFullYear(), 0, 1); return `${d.getFullYear()}-W${Math.ceil(((d - y) / 86400000 + y.getDay() + 1) / 7)}`; };

export async function initTip() {
  const set = store.getSettings();
  const box = $("#daily-tip");
  if (!box || set.tip === "off") return;
  let key;
  if (set.tip === "visit") {
    try { if (sessionStorage.getItem("anemone.tip")) return; sessionStorage.setItem("anemone.tip", "1"); } catch { /* show anyway */ }
    key = "visit";
  } else {
    key = set.tip === "daily" ? todayStr() : weekKey();
    if (set.tipSeen === key) return;
    store.setSetting("tipSeen", key);
  }
  let tips;
  try { tips = await getJson("tips.json"); } catch { return; }
  if (!tips.concepts.length) return;
  const rnd = seeded(todayStr() + set.tip + (key === "visit" ? String(Math.random()) : ""));
  const c = tips.concepts[Math.floor(rnd() * tips.concepts.length)];
  box.textContent = "";
  box.hidden = false;
  const testHost = h("div", {});
  box.append(h("section", { class: "callout", "aria-labelledby": "tip-h" },
    h("h2", { id: "tip-h", text: t("tip.title") }),
    h("h3", { text: c.name }), h("p", { text: c.short }), h("p", {}, h("a", { href: c.url, text: t("tip.more") })),
    testHost));
  const lessons = tips.lessons;
  if (!lessons.length) return;
  const l = lessons[Math.floor(rnd() * lessons.length)];
  const items = questionsOf(await payload(l.course, l.id)).filter((x) => x.q.type === "mcq" || x.q.type === "tf");
  if (!items.length) return;
  const it = items[Math.floor(rnd() * items.length)];
  testHost.append(h("h3", { text: t("tip.test") }));
  mountQuestion(testHost, it.q, { onAnswer: (res) => { const r = record(it.key, res.ok, "review"); if (res.ok) addXp(RULES.review, "tip"); } });
}
