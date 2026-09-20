// Interactive questions: mcq, tf, match, order, cloze, case. No drag and drop anywhere: ordering uses
// move-up / move-down buttons, matching uses native selects, every state is written in words (never colour alone),
// and feedback receives focus so screen readers read it.
import { h, shuffle, announce, alertMsg } from "./dom.js";
import { t } from "./i18n.js";

let uid = 0;
const letter = (i) => String.fromCharCode(65 + i);
const norm = (a) => JSON.stringify(a);

function mark(label, kind, text) {
  label.append(h("span", { class: "mark small", "data-kind": kind }, ` — ${kind === "right" ? "✓" : kind === "yours" ? "•" : "✗"} ${text}`));
}

/** Build one question. Returns { el, focus(), lock() }.
 *  opts: onAnswer({ok, score, revealed}), deferFeedback, onContinue, continueLabel, heading (string for the legend prefix) */
export function mountQuestion(host, q, opts = {}) {
  const id = "q" + ++uid;
  const legend = h("legend", { class: "q-title", id: id + "-l" });
  const fs = h("fieldset", { class: "quiz-q", "data-type": q.type }, legend);
  const body = h("div", { class: "q-body" });
  const fb = h("div", { class: "feedback", tabindex: "-1", hidden: true });
  const actions = h("div", { class: "btn-row" });
  fs.append(body, actions, fb);
  host.append(fs);
  let answered = false;
  let impl;

  const finish = (res) => {
    if (answered) return;
    answered = true;
    impl.lock?.();
    checkBtn.remove(); revealBtn?.remove();
    if (opts.deferFeedback) {
      fb.hidden = false;
      fb.setAttribute("role", "status");
      fb.textContent = t("q.recorded");
      opts.onAnswer?.(res);
      if (opts.onContinue) fb.append(h("div", { class: "btn-row" }, h("button", { type: "button", class: "btn btn-primary", onclick: () => opts.onContinue(res) }, opts.continueLabel || t("q.continue"))));
      return;
    }
    impl.markResult?.(res);
    fb.hidden = false;
    fb.setAttribute("role", "group");
    fb.setAttribute("aria-labelledby", id + "-v");
    fb.textContent = "";
    fb.append(h("p", { class: "verdict", id: id + "-v" }, res.revealed ? t("q.revealed") : res.ok ? `✓ ${t("q.right")}` : res.score > 0 ? `◐ ${t("q.partial")}` : `✗ ${t("q.wrong")}`));
    if (!res.ok && impl.correctText) fb.append(h("p", {}, h("strong", { text: t("q.correct-answer") + " " }), impl.correctText()));
    const ex = impl.explain ? impl.explain() : q.explain;
    if (ex) fb.append(h("p", { text: ex }));
    if (opts.onContinue) fb.append(h("div", { class: "btn-row" }, h("button", { type: "button", class: "btn btn-primary", onclick: () => opts.onContinue(res) }, opts.continueLabel || t("q.continue"))));
    fb.focus();
    opts.onAnswer?.(res);
  };

  const checkBtn = h("button", { type: "button", class: "btn btn-primary", onclick: () => {
    const r = impl.evaluate();
    if (!r) { alertMsg(t("q.choose-first")); impl.focusFirst?.(); return; }
    finish({ ...r, revealed: false });
  } }, t("q.check"));
  const revealBtn = opts.noReveal ? null : h("button", { type: "button", class: "btn btn-ghost", onclick: () => finish({ ok: false, score: 0, revealed: true }) }, opts.deferFeedback ? t("exam.skip") : t("q.reveal"));
  actions.append(checkBtn, revealBtn);

  const T = q.type;
  if (T === "mcq" || T === "tf") impl = mcqImpl(q, id, body, legend);
  else if (T === "match") impl = matchImpl(q, id, body, legend);
  else if (T === "order") impl = orderImpl(q, id, body, legend);
  else if (T === "cloze") impl = clozeImpl(q, id, body, legend);
  else if (T === "case") { impl = caseImpl(q, id, body, legend, opts, finish, fs); checkBtn.remove(); revealBtn?.remove(); actions.remove(); }
  return { el: fs, focus: () => impl.focusFirst?.() || fs.focus(), lock: () => impl.lock?.(), get answered() { return answered; } };
}

function mcqImpl(q, id, body, legend) {
  const opts = q.type === "tf" ? [t("q.true"), t("q.false")] : q.options;
  const ans = q.type === "tf" ? (q.answer ? 0 : 1) : q.answer;
  legend.textContent = q.prompt;
  const group = h("div", { class: "q-options", role: "radiogroup", "aria-labelledby": id + "-l" });
  const labels = opts.map((o, i) => {
    const input = h("input", { type: "radio", name: id, value: i });
    const label = h("label", { class: "choice" }, input, h("span", {}, q.type === "tf" ? "" : `${letter(i)}) `, o));
    group.append(label);
    return { input, label };
  });
  body.append(group);
  const sel = () => labels.findIndex((l) => l.input.checked);
  return {
    focusFirst: () => { labels[0].input.focus(); return true; },
    evaluate: () => { const v = sel(); if (v < 0) return null; return { ok: v === ans, score: v === ans ? 1 : 0, given: v }; },
    lock: () => labels.forEach((l) => (l.input.disabled = true)),
    markResult: (res) => {
      labels.forEach((l, i) => {
        if (i === ans) mark(l.label, "right", t("q.mark-correct"));
        else if (res.given === i) mark(l.label, "wrong", t("q.mark-yours"));
      });
    },
    correctText: () => (q.type === "tf" ? opts[ans] : `${letter(ans)}) ${opts[ans]}`),
  };
}

function matchImpl(q, id, body, legend) {
  legend.textContent = q.prompt;
  const rights = shuffle(q.pairs.map((p) => p[1]));
  const rows = q.pairs.map((p, i) => {
    const sid = `${id}-s${i}`;
    const select = h("select", { id: sid }, h("option", { value: "", text: t("q.choose") }), rights.map((r) => h("option", { value: r, text: r })));
    const row = h("div", { class: "pair-row" }, h("label", { for: sid, text: p[0] }), select);
    body.append(row);
    return { select, row, left: p[0], right: p[1] };
  });
  body.classList.add("pair-grid");
  return {
    focusFirst: () => { rows[0].select.focus(); return true; },
    evaluate: () => {
      if (rows.some((r) => !r.select.value)) return null;
      const good = rows.filter((r) => r.select.value === r.right).length;
      return { ok: good === rows.length, score: good / rows.length, given: rows.map((r) => r.select.value) };
    },
    lock: () => rows.forEach((r) => (r.select.disabled = true)),
    markResult: () => rows.forEach((r) => mark(r.row, r.select.value === r.right ? "right" : "wrong", r.select.value === r.right ? t("q.mark-correct") : t("q.mark-expected", { answer: r.right }))),
    correctText: () => q.pairs.map((p) => `${p[0]} → ${p[1]}`).join("; "),
  };
}

function orderImpl(q, id, body, legend) {
  legend.textContent = q.prompt;
  let cur = shuffle(q.items);
  if (norm(cur) === norm(q.items)) cur = [...q.items].reverse();
  const list = h("ol", { class: "order-list", "aria-label": q.prompt });
  body.append(h("p", { class: "small muted", text: t("q.order-help") }), list);
  let locked = false;
  const draw = (focusIdx, focusDir) => {
    list.textContent = "";
    cur.forEach((item, i) => {
      const up = h("button", { type: "button", class: "btn btn-ghost", "aria-label": t("q.move-up", { item }), disabled: locked || i === 0, onclick: () => move(i, -1) }, "↑");
      const down = h("button", { type: "button", class: "btn btn-ghost", "aria-label": t("q.move-down", { item }), disabled: locked || i === cur.length - 1, onclick: () => move(i, 1) }, "↓");
      list.append(h("li", { class: "order-item" }, h("span", { class: "n", text: `${i + 1}.` }), h("span", { class: "txt", text: item }), up, down));
    });
    if (focusIdx != null) {
      const li = list.children[focusIdx];
      const btns = li.querySelectorAll("button");
      (btns[focusDir < 0 ? 0 : 1]?.disabled ? btns[focusDir < 0 ? 1 : 0] : btns[focusDir < 0 ? 0 : 1])?.focus();
    }
  };
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= cur.length) return;
    [cur[i], cur[j]] = [cur[j], cur[i]];
    draw(j, d);
    announce(t("q.moved", { item: cur[j], pos: j + 1, total: cur.length }));
  };
  draw();
  return {
    focusFirst: () => { list.querySelector("button:not([disabled])")?.focus(); return true; },
    evaluate: () => {
      const good = cur.filter((x, i) => x === q.items[i]).length;
      return { ok: good === cur.length, score: good === cur.length ? 1 : good / cur.length * 0.5, given: [...cur] };
    },
    lock: () => { locked = true; draw(); },
    markResult: () => { list.querySelectorAll("li").forEach((li, i) => mark(li, cur[i] === q.items[i] ? "right" : "wrong", cur[i] === q.items[i] ? t("q.mark-correct") : t("q.mark-expected", { answer: q.items[i] }))); },
    correctText: () => q.items.map((x, i) => `${i + 1}. ${x}`).join("  "),
  };
}

function clozeImpl(q, id, body, legend) {
  legend.textContent = q.prompt;
  const p = h("p", { class: "cloze-text" });
  const parts = q.text.split(/\{\{(\d+)\}\}/);
  const selects = [];
  parts.forEach((part, i) => {
    if (i % 2 === 0) p.append(part);
    else {
      const n = Number(part), b = q.blanks[n - 1];
      const select = h("select", { "aria-label": t("q.blank", { n }) }, h("option", { value: "", text: `(${n})` }), b.options.map((o, k) => h("option", { value: k, text: o })));
      selects.push({ select, b, n });
      p.append(select);
    }
  });
  body.append(p);
  return {
    focusFirst: () => { selects[0].select.focus(); return true; },
    evaluate: () => {
      if (selects.some((s) => s.select.value === "")) return null;
      const good = selects.filter((s) => Number(s.select.value) === s.b.answer).length;
      return { ok: good === selects.length, score: good / selects.length, given: selects.map((s) => Number(s.select.value)) };
    },
    lock: () => selects.forEach((s) => (s.select.disabled = true)),
    markResult: () => selects.forEach((s) => s.select.after(h("span", { class: "mark small" }, Number(s.select.value) === s.b.answer ? ` ✓ ` : ` ✗ (${s.b.options[s.b.answer]}) `))),
    correctText: () => selects.map((s) => `(${s.n}) ${s.b.options[s.b.answer]}`).join("; "),
  };
}

function caseImpl(q, id, body, legend, opts, finish, fs) {
  legend.textContent = t("q.case");
  body.append(h("p", { class: "q-scenario", text: q.scenario }));
  const slot = h("div", { class: "case-parts" });
  body.append(slot);
  let idx = 0, good = 0;
  const results = [];
  const next = () => {
    slot.textContent = "";
    if (idx >= q.parts.length) {
      const score = good / q.parts.length;
      if (opts.deferFeedback) { finish({ ok: score === 1, score, revealed: false }); return; }
      const done = h("div", { class: "feedback", "data-result": score === 1 ? "right" : "wrong", tabindex: "-1", role: "group", "aria-labelledby": id + "-cv" },
        h("p", { class: "verdict", id: id + "-cv" }, `${score === 1 ? "✓" : "◐"} ${t("q.case-score", { good, total: q.parts.length })}`),
        h("p", {}, h("strong", { text: t("q.takeaway") + " " }), q.takeaway),
        opts.onContinue ? h("div", { class: "btn-row" }, h("button", { type: "button", class: "btn btn-primary", onclick: () => opts.onContinue({ ok: score === 1, score }) }, opts.continueLabel || t("q.continue"))) : null);
      slot.append(done);
      done.focus();
      finish({ ok: score === 1, score, revealed: false, __case: true });
      return;
    }
    const part = { ...q.parts[idx], type: "mcq", id: `${q.id}-p${idx + 1}` };
    const last = idx === q.parts.length - 1;
    mountQuestion(slot, part, {
      noReveal: true,
      deferFeedback: opts.deferFeedback,
      continueLabel: last ? t("q.case-finish") : t("q.case-next"),
      onAnswer: (r) => { results.push(r); if (r.ok) good++; if (opts.deferFeedback) { idx++; setTimeout(next, 0); } },
      onContinue: opts.deferFeedback ? undefined : () => { idx++; next(); },
    });
    const first = slot.querySelector("input");
    first?.focus();
  };
  next();
  return { focusFirst: () => { slot.querySelector("input")?.focus(); return true; } };
}
