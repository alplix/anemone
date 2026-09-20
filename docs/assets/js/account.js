// Optional account view: register / sign in / recover, profile with per-field visibility, leaderboard opt-in,
// groups, export and deletion. Nothing here is required to use the course; with no API configured it just explains the model.
import { h, announce, toast, focusEl } from "./dom.js";
import { t, num, dur } from "./i18n.js";
import * as api from "./api.js";
import * as store from "./store.js";
import { confirmDialog } from "./dialog.js";
import { loadCourses } from "./pool.js";

const FIELDS = ["first_name", "last_name", "job", "education", "city", "about"];
const AGES = ["", "under18", "18-24", "25-34", "35-44", "45-54", "55-64", "65plus"];
const COUNTRIES = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");

export const errText = (e) => {
  const c = e?.code || "unknown";
  if (/_not_allowed$/.test(c)) return t("acc.err.not_allowed");
  const k = "acc.err." + c;
  const s = t(k);
  return s === k ? t("acc.err.unknown") : s;
};

const field = (id, label, input, hint) => h("div", { class: "field", style: "align-items:flex-start" }, h("label", { for: id, text: label }), input, hint ? h("span", { class: "small muted", text: hint }) : null);

let courseMapPromise;
export async function courseOfLesson() {
  courseMapPromise ||= loadCourses().then((cs) => { const m = {}; cs.forEach((c) => c.units.forEach((u) => u.lessons.forEach((l) => { m[l.id] = c.id; }))); return m; });
  return courseMapPromise;
}

export async function afterSignIn() {
  try { await api.pullAndMerge(); } catch { /* offline or no save yet */ }
  try { await api.pushNow(await courseOfLesson(), { force: true }); } catch { /* try again later */ }
}

export async function renderAccount(root) {
  root.textContent = "";
  root.append(h("p", { class: "lead", text: t("account.lead") }));
  if (!api.enabled()) {
    root.append(h("p", { class: "notice", role: "note", text: t("account.soon") }), h("ul", {}, [1, 2, 3, 4].map((i) => h("li", { text: t("account.point" + i) }))));
    return;
  }
  if (!api.getAuth()) return renderAuth(root);
  return renderHome(root);
}

// ---------------------------------------------------------------------------
function renderAuth(root) {
  const status = h("p", { role: "status", class: "small", "aria-live": "polite" });
  const fail = (e) => { status.textContent = errText(e); status.className = "notice"; };
  const busy = (msg) => { status.className = "small"; status.textContent = msg; };

  // sign in
  const lu = h("input", { type: "text", id: "li-user", autocomplete: "username", required: true, maxlength: 24 });
  const lp = h("input", { type: "password", id: "li-pass", autocomplete: "current-password", required: true });
  const login = h("form", { onsubmit: async (e) => {
    e.preventDefault();
    try {
      busy(t("acc.deriving"));
      const key = await api.deriveKey(lp.value, "auth", lu.value);
      api.setAuth({ username: lu.value.trim(), key });
      await api.call("GET", "/api/me");
      await afterSignIn();
      renderAccount(root);
    } catch (err) { api.setAuth(null); fail(err.code === "unauthorized" ? Object.assign(err, { code: "bad_login" }) : err); }
  } }, h("h2", { text: t("acc.signin") }), field("li-user", t("acc.username"), lu), field("li-pass", t("acc.password"), lp), h("div", { class: "btn-row" }, h("button", { class: "btn btn-primary", type: "submit" }, t("acc.signin"))));

  // register
  const ru = h("input", { type: "text", id: "rg-user", autocomplete: "username", required: true, maxlength: 24, "aria-describedby": "rg-user-h" });
  const rp = h("input", { type: "password", id: "rg-pass", autocomplete: "new-password", required: true, minlength: 8 });
  const rp2 = h("input", { type: "password", id: "rg-pass2", autocomplete: "new-password", required: true, minlength: 8 });
  const reg = h("form", { onsubmit: async (e) => {
    e.preventDefault();
    if (rp.value !== rp2.value) return fail({ code: "password_mismatch" });
    if (rp.value.length < 8) return fail({ code: "password_short" });
    try {
      const m = await import("./moderation.js");
      if (m.isOffensive(ru.value)) return fail({ code: "username_not_allowed" });
      busy(t("acc.deriving"));
      const code = api.newRecoveryCode();
      const username = ru.value.trim();
      const [key, recoveryKey] = await Promise.all([api.deriveKey(rp.value, "auth", username), api.deriveKey(code.replace(/-/g, ""), "recovery", username)]);
      status.textContent = "";
      await showRecovery(root, code, username);
      busy(t("acc.registering"));
      await api.call("POST", "/api/register", { username, key, recoveryKey }, { auth: false });
      api.setAuth({ username, key });
      await afterSignIn();
      toast(t("acc.welcome.title"), t("acc.welcome.msg", { name: username }));
      renderAccount(root);
    } catch (err) { if (err?.code === "cancelled") return; fail(err); }
  } }, h("h2", { text: t("acc.register") }), h("p", { class: "small muted", text: t("acc.register-intro") }),
    field("rg-user", t("acc.username"), ru, t("acc.username-hint")), field("rg-pass", t("acc.password"), rp, t("acc.password-hint")), field("rg-pass2", t("acc.password2"), rp2),
    h("div", { class: "btn-row" }, h("button", { class: "btn btn-primary", type: "submit" }, t("acc.register"))));

  // recover
  const cu = h("input", { type: "text", id: "rc-user", autocomplete: "username", required: true, maxlength: 24 });
  const cc = h("input", { type: "text", id: "rc-code", autocomplete: "off", required: true, placeholder: "XXXX-XXXX-XXXX-XXXX-XXXX" });
  const cp = h("input", { type: "password", id: "rc-pass", autocomplete: "new-password", required: true, minlength: 8 });
  const rec = h("details", { class: "toc" }, h("summary", { text: t("acc.forgot") }), h("form", { onsubmit: async (e) => {
    e.preventDefault();
    try {
      busy(t("acc.deriving"));
      const [recoveryKey, newKey] = await Promise.all([api.deriveKey(api.cleanRecovery(cc.value).replace(/-/g, ""), "recovery", cu.value), api.deriveKey(cp.value, "auth", cu.value)]);
      await api.call("POST", "/api/recover", { username: cu.value.trim(), recoveryKey, newKey }, { auth: false });
      api.setAuth({ username: cu.value.trim(), key: newKey });
      await afterSignIn();
      renderAccount(root);
    } catch (err) { fail(err.code === "unauthorized" ? Object.assign(err, { code: "bad_recovery" }) : err); }
  } }, h("p", { class: "small", text: t("acc.recover-intro") }), field("rc-user", t("acc.username"), cu), field("rc-code", t("acc.recovery-code"), cc), field("rc-pass", t("acc.new-password"), cp), h("div", { class: "btn-row" }, h("button", { class: "btn", type: "submit" }, t("acc.recover")))));

  root.append(h("div", { class: "callout", text: t("acc.optional") }), login, reg, rec, status);
}

function showRecovery(root, code, username) {
  return new Promise((resolve, reject) => {
    root.textContent = "";
    const ok = h("input", { type: "checkbox", id: "rc-saved" });
    const go = h("button", { class: "btn btn-primary", type: "button", disabled: true, onclick: () => resolve() }, t("acc.recovery-continue"));
    ok.addEventListener("change", () => { go.disabled = !ok.checked; });
    const say = h("p", { role: "status", class: "small" });
    const copy = h("button", { class: "btn", type: "button", onclick: async () => { try { await navigator.clipboard.writeText(code); say.textContent = t("acc.copied"); } catch { say.textContent = t("acc.copy-failed"); } } }, t("acc.copy"));
    const dl = h("button", { class: "btn", type: "button", onclick: () => {
      const blob = new Blob([`Anemone recovery code for ${username}\n${code}\nKeep it private. Anyone with this code can reset your password.\n`], { type: "text/plain" });
      const a = h("a", { href: URL.createObjectURL(blob), download: "anemone-recovery-code.txt" }); document.body.append(a); a.click(); a.remove();
    } }, t("acc.download"));
    root.append(h("h2", { tabindex: "-1", id: "rc-h", text: t("acc.recovery-title") }), h("p", { text: t("acc.recovery-intro") }),
      h("p", {}, h("code", { style: "font-size:1.3rem;letter-spacing:.06em", "aria-label": code.split("").join(" ") }, code)),
      h("div", { class: "btn-row" }, copy, dl), say,
      h("div", { class: "field" }, ok, h("label", { for: "rc-saved", text: t("acc.recovery-saved") })),
      h("div", { class: "btn-row" }, go, h("button", { class: "btn btn-ghost", type: "button", onclick: () => { reject(Object.assign(new Error("cancelled"), { code: "cancelled" })); renderAccount(root); } }, t("dialog.cancel"))));
    focusEl(document.getElementById("rc-h"));
  });
}

// ---------------------------------------------------------------------------
async function renderHome(root) {
  const status = h("p", { role: "status", class: "small", "aria-live": "polite" });
  let me;
  try { me = await api.call("GET", "/api/me"); }
  catch (e) {
    if (e.code === "unauthorized") { api.setAuth(null); return renderAccount(root); }
    root.append(h("p", { class: "notice", text: errText(e) }), h("button", { class: "btn", type: "button", onclick: () => renderAccount(root) }, t("acc.retry")));
    return;
  }
  const say = (msg) => { status.textContent = msg; };
  const p = me.profile || {}, vis = p.vis || {};
  root.append(
    h("section", { "aria-labelledby": "ah" },
      h("h2", { id: "ah", text: t("acc.signed-in", { name: me.username }) }),
      h("div", { class: "btn-row" },
        h("button", { class: "btn", type: "button", onclick: async () => { say(t("acc.syncing")); try { await api.pushNow(await courseOfLesson(), { force: true }); say(t("acc.synced")); } catch (e) { say(errText(e)); } } }, t("acc.sync-now")),
        h("button", { class: "btn btn-ghost", type: "button", onclick: () => { api.setAuth(null); renderAccount(root); announce(t("acc.signed-out")); } }, t("acc.signout"))),
      h("p", { class: "small muted", text: t("acc.sync-note") })),
  );

  // opt-in
  const oi = h("input", { type: "checkbox", id: "optin", checked: me.optin ? true : null });
  oi.addEventListener("change", async () => { try { await api.call("PUT", "/api/optin", { optin: oi.checked }); say(oi.checked ? t("acc.optin-on") : t("acc.optin-off")); } catch (e) { oi.checked = !oi.checked; say(errText(e)); } });
  root.append(h("section", { "aria-labelledby": "oh" }, h("h2", { id: "oh", text: t("acc.leaderboard") }), h("p", { text: t("acc.optin-help") }), h("div", { class: "field" }, oi, h("label", { for: "optin", text: t("acc.optin") })), h("p", {}, h("a", { href: "../leaderboard/", text: t("acc.see-leaderboard") }))));

  // profile
  const rows = [];
  const inputs = {};
  const ageSel = h("select", { id: "pf-age" }, AGES.map((a) => h("option", { value: a, text: a ? t("age." + a) : t("acc.not-say"), selected: (p.age_range || "") === a ? true : null })));
  const dn = (() => { try { return new Intl.DisplayNames([document.documentElement.lang], { type: "region" }); } catch { return null; } })();
  const countrySel = h("select", { id: "pf-country" }, h("option", { value: "", text: t("acc.not-say") }), COUNTRIES.map((c) => h("option", { value: c, text: `${dn?.of(c) || c}`, selected: (p.country || "") === c ? true : null })));
  const visSel = (f) => h("select", { id: `vis-${f}`, "aria-label": t("acc.visibility-of", { field: t("prof.f." + f) }) }, h("option", { value: "0", text: t("acc.only-me"), selected: !vis[f] ? true : null }), h("option", { value: "1", text: t("acc.public"), selected: vis[f] ? true : null }));
  const visInputs = {};
  for (const f of FIELDS) {
    inputs[f] = f === "about" ? h("textarea", { id: `pf-${f}`, rows: 3, maxlength: 280, style: "width:100%" }, p[f] || "") : h("input", { type: "text", id: `pf-${f}`, maxlength: 120, value: p[f] || "" });
    visInputs[f] = visSel(f);
    rows.push(h("div", { class: "field" }, h("label", { for: `pf-${f}`, text: t("prof.f." + f) }), inputs[f], visInputs[f]));
  }
  const av = visSel("age_range"), cv = visSel("country");
  const minorNote = h("p", { class: "notice", role: "note", hidden: ageSel.value !== "under18" ? true : null, text: t("acc.minor-note") });
  ageSel.addEventListener("change", () => { minorNote.hidden = ageSel.value !== "under18"; });
  const saveBtn = h("button", { class: "btn btn-primary", type: "submit" }, t("acc.save-profile"));
  const form = h("form", { onsubmit: async (e) => {
    e.preventDefault();
    const profile = { age_range: ageSel.value, country: countrySel.value };
    const v = { age_range: av.value === "1", country: cv.value === "1" };
    for (const f of FIELDS) { profile[f] = inputs[f].value; v[f] = visInputs[f].value === "1"; }
    try {
      const m = await import("./moderation.js");
      for (const f of FIELDS) if (profile[f] && m.isOffensive(profile[f])) throw Object.assign(new Error("na"), { code: "not_allowed" });
      const r = await api.call("PUT", "/api/profile", { profile, vis: v });
      say(t("acc.profile-saved"));
      if (r.minor) say(t("acc.profile-saved") + " " + t("acc.minor-note"));
    } catch (err) { say(errText(err)); }
  } },
  h("fieldset", {}, h("legend", { text: t("acc.profile") }), h("p", { class: "small muted", text: t("acc.profile-help") }), ...rows,
    h("div", { class: "field" }, h("label", { for: "pf-age", text: t("prof.f.age_range") }), ageSel, av),
    h("div", { class: "field" }, h("label", { for: "pf-country", text: t("prof.f.country") }), countrySel, cv), minorNote,
    h("div", { class: "btn-row" }, saveBtn)));
  root.append(form);

  // groups
  const groupsBox = h("div", {});
  const drawGroups = (groups) => {
    groupsBox.textContent = "";
    if (!groups.length) groupsBox.append(h("p", { class: "muted", text: t("acc.no-groups") }));
    else groupsBox.append(h("ul", {}, groups.map((g) => h("li", {}, h("strong", { text: g.name }), ` — ${t("acc.group-code")}: `, h("code", { text: g.code }), " ",
      h("a", { class: "btn btn-ghost", href: `../leaderboard/?group=${g.id}` }, t("acc.group-board")),
      h("button", { class: "btn btn-ghost", type: "button", onclick: async () => { try { await api.call("POST", "/api/groups/leave", { id: g.id }); const r = await api.call("GET", "/api/groups"); drawGroups(r.groups); say(t("acc.left-group")); } catch (e) { say(errText(e)); } } }, t("acc.leave"))))));
  };
  drawGroups(me.groups || []);
  const gname = h("input", { type: "text", id: "g-name", maxlength: 40 });
  const gcode = h("input", { type: "text", id: "g-code", maxlength: 12, autocomplete: "off" });
  root.append(h("section", { "aria-labelledby": "gh" }, h("h2", { id: "gh", text: t("acc.groups") }), h("p", { text: t("acc.groups-help") }), groupsBox,
    h("form", { onsubmit: async (e) => { e.preventDefault(); try { const r = await api.call("POST", "/api/groups", { name: gname.value }); drawGroups((await api.call("GET", "/api/groups")).groups); say(t("acc.group-created", { code: r.code })); gname.value = ""; } catch (err) { say(errText(err)); } } }, field("g-name", t("acc.group-name"), gname), h("button", { class: "btn", type: "submit" }, t("acc.create-group"))),
    h("form", { onsubmit: async (e) => { e.preventDefault(); try { await api.call("POST", "/api/groups/join", { code: gcode.value }); drawGroups((await api.call("GET", "/api/groups")).groups); say(t("acc.joined")); gcode.value = ""; } catch (err) { say(errText(err)); } } }, field("g-code", t("acc.join-code"), gcode), h("button", { class: "btn", type: "submit" }, t("acc.join")))));

  // data
  root.append(h("section", { "aria-labelledby": "dh" }, h("h2", { id: "dh", text: t("acc.data") }), h("p", { text: t("acc.data-help") }),
    h("div", { class: "btn-row" },
      h("button", { class: "btn", type: "button", onclick: async () => { try { const j = await api.call("GET", "/api/export"); const blob = new Blob([JSON.stringify(j, null, 1)], { type: "application/json" }); const a = h("a", { href: URL.createObjectURL(blob), download: "anemone-account-export.json" }); document.body.append(a); a.click(); a.remove(); say(t("acc.exported")); } catch (e) { say(errText(e)); } } }, t("acc.export")),
      h("button", { class: "btn btn-ghost", type: "button", onclick: async () => { if (!(await confirmDialog({ title: t("acc.delete-title"), message: t("acc.delete-msg"), confirmLabel: t("acc.delete") }))) return; try { await api.call("DELETE", "/api/account"); api.setAuth(null); toast(t("acc.deleted"), ""); renderAccount(root); } catch (e) { say(errText(e)); } } }, t("acc.delete")))));
  root.append(status);
}
