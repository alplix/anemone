// Leaderboards (global / weekly / per course / my groups) and public profile pages. Optional: needs the accounts service.
import { h, focusEl } from "./dom.js";
import { t, num, pct, dur, langPath } from "./i18n.js";
import * as api from "./api.js";
import { errText } from "./account.js";
import { courseIds } from "./pool.js";

const METRICS = ["xp", "acc", "time", "streak"];

export async function renderLeaderboard(root) {
  root.textContent = "";
  root.append(h("p", { class: "lead", text: t("lb.intro") }));
  if (!api.enabled()) { root.append(h("p", { class: "notice", role: "note", text: t("account.soon") })); return; }
  const params = new URLSearchParams(location.search);
  const groupId = Number(params.get("group")) || 0;
  const scope = h("select", { id: "lb-scope" },
    h("option", { value: "global", text: t("lb.scope.global") }), h("option", { value: "weekly", text: t("lb.scope.weekly") }),
    courseIds().map((c) => h("option", { value: "course:" + c, text: t("lb.scope.course", { course: c }) })),
    groupId ? h("option", { value: "group", text: t("lb.scope.group"), selected: true }) : null);
  const metric = h("select", { id: "lb-metric" }, METRICS.map((m) => h("option", { value: m, text: t("lb.metric." + m) })));
  const out = h("div", { "aria-live": "polite" });
  const load = async () => {
    out.textContent = t("panel.loading");
    try {
      const q = scope.value === "group" ? `/api/groups/${groupId}/board?metric=${metric.value}` : `/api/leaderboard?scope=${encodeURIComponent(scope.value)}&metric=${metric.value}`;
      const r = await api.call("GET", q, undefined, { auth: scope.value === "group" });
      out.textContent = "";
      if (!r.rows.length) { out.append(h("p", { class: "notice", text: t("lb.empty") })); return; }
      const top = r.rows[0];
      out.append(
        h("p", { text: t("lb.summary", { name: top.username, metric: t("lb.metric." + metric.value), n: r.rows.length }) }),
        metric.value === "acc" ? h("p", { class: "small muted", text: t("lb.acc-note", { n: r.minAnswers || 50 }) }) : null,
        h("div", { class: "table-wrap" }, h("table", {}, h("caption", { class: "sr-only", text: t("lb.title") }),
          h("thead", {}, h("tr", {}, ["rank", "name", "level", "xp", "accuracy", "time", "streak"].map((k) => h("th", { scope: "col", text: t("lb.h." + k) })))),
          h("tbody", {}, r.rows.map((x) => h("tr", {}, h("td", { text: num(x.rank) }), h("th", { scope: "row" }, h("a", { href: `../profile/?u=${encodeURIComponent(x.username)}`, text: x.username })), h("td", { text: num(x.level) }), h("td", { text: num(x.xp) }), h("td", { text: x.accuracy == null ? "—" : pct(x.accuracy) }), h("td", { text: dur(x.studySec) }), h("td", { text: num(x.streak) })))))),
        h("p", { class: "small muted", text: t("lb.honour") }));
    } catch (e) { out.textContent = ""; out.append(h("p", { class: "notice", text: errText(e) })); }
  };
  scope.addEventListener("change", load); metric.addEventListener("change", load);
  root.append(h("div", { class: "field" }, h("label", { for: "lb-scope", text: t("lb.scope") }), scope), h("div", { class: "field" }, h("label", { for: "lb-metric", text: t("lb.metric") }), metric), out);
  load();
}

export async function renderProfile(root) {
  root.textContent = "";
  const u = new URLSearchParams(location.search).get("u") || "";
  if (!api.enabled()) { root.append(h("p", { class: "notice", role: "note", text: t("account.soon") })); return; }
  if (!u) { root.append(h("p", { class: "notice", text: t("prof.none") })); return; }
  try {
    const r = await api.call("GET", `/api/profile/${encodeURIComponent(u)}`, undefined, { auth: false });
    const s = r.stats, p = r.profile || {};
    document.title = `${r.username} | ${document.title.split(" | ").pop()}`;
    const rows = Object.keys(p).map((f) => h("div", {}, h("dt", { text: t("prof.f." + f) }), h("dd", { text: f === "age_range" ? t("age." + p[f]) : p[f] })));
    root.append(
      h("h2", { tabindex: "-1", id: "prof-h", text: r.username }),
      h("div", { class: "stat-grid" }, [[t("stats.level"), num(s.level)], [t("stats.xp"), num(s.xp)], [t("stats.accuracy"), s.accuracy == null ? "—" : pct(s.accuracy)], [t("stats.study-time"), dur(s.study_sec)], [t("stats.streak"), `${num(s.streak)} / ${num(s.best_streak)}`], [t("stats.lessons-done"), num(s.lessons_done)], [t("study.badges", { n: num(s.badges), total: "" }).replace(/\s*\(.*$/, ""), num(s.badges)]].map(([k, v]) => h("div", { class: "stat" }, h("span", { class: "v", text: v }), h("span", { class: "k", text: k })))),
      rows.length ? h("dl", {}, rows) : h("p", { class: "muted", text: t("prof.no-public-fields") }),
      h("p", {}, h("button", { class: "btn btn-ghost", type: "button", onclick: async () => { try { await api.call("POST", "/api/report", { kind: "profile", target: r.username, reason: "" }, { auth: true }); document.getElementById("prof-status").textContent = t("prof.reported"); } catch (e) { document.getElementById("prof-status").textContent = errText(e); } } }, t("prof.report"))),
      h("p", { id: "prof-status", role: "status", class: "small" }),
      h("p", {}, h("a", { href: "../leaderboard/", text: t("prof.back") })));
    focusEl(document.getElementById("prof-h"));
  } catch (e) { root.append(h("p", { class: "notice", text: e.code === "not_found" ? t("prof.not-found") : errText(e) })); }
}
