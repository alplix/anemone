// Loads everything under content/ into one model and checks it. Used by build.mjs and validate.mjs.
import path from "node:path";
import { ROOT, readJson, readText, exists, listFiles, listDirs, plainText, slugAscii, words } from "./util.mjs";
import { collectRefs } from "./markdown.mjs";

export const SECTIONS = ["context", "people-time", "claim", "concepts", "assumptions", "how-it-works", "evidence", "critique", "today", "turkey", "exam", "summary"];
export const OPTIONAL_SECTIONS = new Set(["turkey"]);
export const KINDS = new Set(["text", "story", "steps", "myth", "lab", "summary"]);
export const LAYERS = new Set(["core", "deep"]);
export const QTYPES = ["mcq", "tf", "match", "order", "cloze", "case"];
export const BIB_TYPES = new Set(["article", "book", "chapter", "report", "web", "thesis"]);
export const CONCEPT_FAMILIES = new Set(["models", "society", "effects", "news", "audience", "technology", "critical", "culture", "normative", "digital", "method"]);

const C = path.join(ROOT, "content");

export class Report {
  constructor() { this.errors = []; this.warnings = []; }
  err(msg) { this.errors.push(msg); }
  warn(msg) { this.warnings.push(msg); }
}

function tryJson(file, report) {
  try { return readJson(file); }
  catch (e) { report.err(`${rel(file)}: invalid JSON (${e.message})`); return null; }
}
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

function parseFrontMatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text.replace(/\r\n?/g, "\n"));
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2].trim() };
}

export function loadModel() {
  const report = new Report();
  const config = readJson(path.join(ROOT, "site.config.json"));
  const langFile = readJson(path.join(C, "languages.json"));
  const languages = langFile.languages;
  // ANEMONE_PUBLISH=en,de node scripts/validate.mjs  -> validate those languages as if they were published (used while translating)
  for (const code of (process.env.ANEMONE_PUBLISH || "").split(",").map((s) => s.trim()).filter(Boolean)) {
    const l = languages.find((x) => x.code === code);
    if (l && l.status !== "source") l.status = "published";
  }
  const langByCode = Object.fromEntries(languages.map((l) => [l.code, l]));
  const publishedLangs = languages.filter((l) => l.status === "source" || l.status === "published");

  // ---- course structure -------------------------------------------------
  const courses = {};
  for (const cid of listDirs(path.join(C, "courses"))) {
    const structure = tryJson(path.join(C, "courses", cid, "course.json"), report);
    if (!structure) continue;
    const lessons = [];
    const lessonById = {};
    const unitById = {};
    structure.units.forEach((u, ui) => {
      unitById[u.id] = { ...u, index: ui };
      u.lessons.forEach((l) => {
        const rec = { ...l, unit: u.id, unitIndex: ui, index: lessons.length };
        if (lessonById[l.id]) report.err(`course ${cid}: duplicate lesson id ${l.id}`);
        lessonById[l.id] = rec;
        lessons.push(rec);
      });
    });
    const meta = {};
    for (const f of listFiles(path.join(C, "courses", cid, "lessons"), ".json")) {
      const j = tryJson(path.join(C, "courses", cid, "lessons", f), report);
      if (j) meta[j.id || f.replace(/\.json$/, "")] = j;
    }
    courses[cid] = { id: cid, structure, units: structure.units, unitById, lessons, lessonById, meta };
  }

  // ---- bibliography -----------------------------------------------------
  const bib = {};
  for (const f of listFiles(path.join(C, "bibliography"), ".json")) {
    const j = tryJson(path.join(C, "bibliography", f), report);
    if (!j) continue;
    for (const [id, entry] of Object.entries(j)) {
      if (id.startsWith("_")) continue;
      if (bib[id]) {
        // The same source may be verified independently by several authors. Entries that describe the same work
        // (title, year, authors, publisher, doi) are merged: verification methods and notes are combined.
        const a = bib[id], b = entry;
        const same = a.title === b.title && a.year === b.year && JSON.stringify(a.authors || []) === JSON.stringify(b.authors || []) && (a.publisher || "") === (b.publisher || "") && (a.doi || "") === (b.doi || "");
        if (!same) report.err(`bibliography: id ${id} defined twice with different content (${f})`);
        else {
          const v = a.verified, w = b.verified;
          if (v && w) {
            v.methods = [...new Set([...(v.methods || []), ...(w.methods || [])])];
            if (w.note && !(v.note || "").includes(w.note)) v.note = [v.note, w.note].filter(Boolean).join(" | ");
            if (w.status !== "ok") v.status = w.status;
          }
          if (!a.edition && b.edition) a.edition = b.edition;
        }
        continue;
      }
      bib[id] = { id, ...entry, _file: f };
    }
  }

  // ---- people / concepts (language independent) --------------------------
  const people = {};
  for (const f of listFiles(path.join(C, "people"), ".json")) {
    const j = tryJson(path.join(C, "people", f), report);
    if (j) people[j.id || f.replace(/\.json$/, "")] = j;
  }
  const concepts = {};
  for (const f of listFiles(path.join(C, "concepts"), ".json")) {
    const j = tryJson(path.join(C, "concepts", f), report);
    if (j) concepts[j.id || f.replace(/\.json$/, "")] = j;
  }

  // ---- terminology -------------------------------------------------------
  const terms = {};
  for (const f of listFiles(path.join(C, "terminology"), ".json")) {
    const j = tryJson(path.join(C, "terminology", f), report);
    if (j) for (const [k, v] of Object.entries(j)) if (!k.startsWith("_")) terms[k] = { ...(terms[k] || {}), ...v };
  }

  // ---- per language ------------------------------------------------------
  const i18n = {};
  for (const l of languages) {
    const dir = path.join(C, "i18n", l.code);
    if (!exists(dir)) continue;
    const L = { ui: {}, site: {}, courses: {}, people: {}, concepts: {} };
    // interface strings: ui.json plus optional ui.<area>.json files (e.g. ui.account.json), merged
    for (const f of listFiles(dir, ".json").filter((x) => /^ui(\.[a-z-]+)?\.json$/.test(x))) Object.assign(L.ui, tryJson(path.join(dir, f), report) || {});
    for (const f of listFiles(path.join(dir, "site"), ".md")) {
      const { meta, body } = parseFrontMatter(readText(path.join(dir, "site", f)));
      L.site[f.replace(/\.md$/, "")] = { ...meta, body };
    }
    for (const cid of listDirs(path.join(dir, "courses"))) {
      const cj = tryJson(path.join(dir, "courses", cid, "course.json"), report);
      const lessons = {};
      for (const f of listFiles(path.join(dir, "courses", cid, "lessons"), ".json")) {
        const j = tryJson(path.join(dir, "courses", cid, "lessons", f), report);
        if (j) lessons[j.id || f.replace(/\.json$/, "")] = j;
      }
      L.courses[cid] = { info: cj, lessons };
    }
    for (const f of listFiles(path.join(dir, "people"), ".json")) {
      const j = tryJson(path.join(dir, "people", f), report);
      if (j) L.people[j.id || f.replace(/\.json$/, "")] = j;
    }
    for (const f of listFiles(path.join(dir, "concepts"), ".json")) {
      const j = tryJson(path.join(dir, "concepts", f), report);
      if (j) L.concepts[j.id || f.replace(/\.json$/, "")] = j;
    }
    i18n[l.code] = L;
  }

  const model = { config, languages, langByCode, publishedLangs, courses, bib, people, concepts, terms, i18n, report };
  runChecks(model);
  return model;
}

// ---------------------------------------------------------------------------
// checks
// ---------------------------------------------------------------------------

const ASCII_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UNICODE_SLUG = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;

function checkSlug(slug, lang, where, report) {
  if (typeof slug !== "string" || !slug) return report.err(`${where}: missing slug`);
  const re = lang.slugPolicy === "unicode" ? UNICODE_SLUG : ASCII_SLUG;
  if (!re.test(slug)) report.err(`${where}: slug "${slug}" violates ${lang.slugPolicy} policy for ${lang.code}`);
}

function runChecks(model) {
  const { report, config, languages, courses, bib, people, concepts, i18n, publishedLangs } = model;

  // languages
  const codes = new Set(), paths = new Set();
  for (const l of languages) {
    if (codes.has(l.code)) report.err(`languages: duplicate code ${l.code}`);
    if (paths.has(l.path)) report.err(`languages: duplicate path ${l.path}`);
    codes.add(l.code); paths.add(l.path);
    if (!["ltr", "rtl"].includes(l.dir)) report.err(`languages: ${l.code} bad dir`);
    if (!["source", "published", "beta", "ui-only", "planned"].includes(l.status)) report.err(`languages: ${l.code} bad status`);
  }
  if (!languages.find((l) => l.code === config.sourceLang && l.status === "source")) report.err("config.sourceLang must be a language with status 'source'");

  // bibliography
  for (const b of Object.values(bib)) {
    const w = `bibliography ${b.id}`;
    if (!BIB_TYPES.has(b.type)) report.err(`${w}: bad type`);
    if (!b.title) report.err(`${w}: missing title`);
    if (!b.year || !Number.isInteger(b.year)) { if (b.type !== "web") report.err(`${w}: missing/invalid year`); }
    if (b.type !== "web" && (!Array.isArray(b.authors) || !b.authors.length) && !b.institution && !b.anonymous) report.err(`${w}: missing authors (use anonymous: true for unsigned pieces)`);
    if (b.type === "article" && !b.container) report.err(`${w}: article needs container`);
    if ((b.type === "book" || b.type === "chapter") && !b.publisher) report.warn(`${w}: no publisher`);
    if (b.type === "web" && !b.url) report.err(`${w}: web entry needs url`);
    if (b.doi && !/^10\.\d{4,9}\/\S+$/.test(b.doi)) report.err(`${w}: malformed doi`);
    if (!b.verified || !["ok", "unresolved"].includes(b.verified.status)) report.err(`${w}: missing verified.status`);
    else if (b.verified.status === "ok" && (!Array.isArray(b.verified.methods) || !b.verified.methods.length)) report.err(`${w}: verified ok needs methods`);
  }
  const bibOk = (id) => bib[id] && bib[id].verified?.status === "ok";

  // people (language independent)
  for (const p of Object.values(people)) {
    const w = `person ${p.id}`;
    if (!Array.isArray(p.sources) || p.sources.length < 2) report.err(`${w}: needs >= 2 independent sources`);
    for (const s of p.sources || []) if (!bibOk(s)) report.err(`${w}: source ${s} missing or not verified ok`);
    for (const s of p.works || []) if (!bibOk(s)) report.err(`${w}: work ${s} missing or not verified ok`);
    if (p.born && !Number.isInteger(p.born.year)) report.err(`${w}: born.year must be an integer`);
    if (p.born && p.died && p.died.year < p.born.year) report.err(`${w}: died before born`);
  }
  for (const c of Object.values(concepts)) {
    const w = `concept ${c.id}`;
    if (!CONCEPT_FAMILIES.has(c.family)) report.err(`${w}: bad family ${c.family}`);
    for (const s of c.sources || []) if (!bibOk(s)) report.err(`${w}: source ${s} missing or not verified ok`);
    for (const r of c.related || []) if (!concepts[r]) report.warn(`${w}: related concept ${r} does not exist yet`);
    for (const r of c.introducedBy || []) if (!people[r]) report.warn(`${w}: introducedBy ${r} does not exist yet`);
  }

  // courses
  for (const course of Object.values(courses)) {
    const seen = new Set();
    for (const l of course.lessons) {
      for (const p of l.prereq || []) {
        if (!course.lessonById[p]) report.err(`lesson ${l.id}: unknown prerequisite ${p}`);
        else if (course.lessonById[p].index >= l.index) report.err(`lesson ${l.id}: prerequisite ${p} is not earlier (cycle risk)`);
      }
      seen.add(l.id);
    }
    // orphan check: every lesson is reachable = has no unmet reference; a lesson that nobody needs and needs nobody is fine only if it is the first
    for (const l of course.lessons) {
      const isRoot = !(l.prereq || []).length;
      const isNeeded = course.lessons.some((o) => (o.prereq || []).includes(l.id));
      if (isRoot && !isNeeded && course.lessons.length > 1) report.warn(`lesson ${l.id}: orphan (no prerequisites and nobody depends on it)`);
    }
    for (const id of Object.keys(course.meta)) if (!course.lessonById[id]) report.err(`lesson meta ${id}: not in course.json`);

    for (const lang of publishedLangs) {
      const L = i18n[lang.code];
      const info = L?.courses?.[course.id]?.info;
      if (!info) { report.err(`course ${course.id}: no i18n course.json for ${lang.code}`); continue; }
      const slugs = new Map();
      const useSlug = (kind, id, slug, where) => {
        checkSlug(slug, lang, where, report);
        const key = `${kind}:${slug}`;
        if (slugs.has(key)) report.err(`${where}: slug "${slug}" already used by ${slugs.get(key)} (${lang.code})`);
        slugs.set(key, where);
      };
      if (!info.title) report.err(`course ${course.id}/${lang.code}: no title`);
      checkSlug(info.slug, lang, `course ${course.id}/${lang.code}`, report);
      for (const u of course.units) {
        const ui = info.units?.[u.id];
        if (!ui?.title) report.err(`course ${course.id}/${lang.code}: unit ${u.id} lacks a title`);
        else useSlug("unit", u.id, ui.slug, `unit ${u.id}/${lang.code}`);
      }
      for (const l of course.lessons) {
        const li = info.lessons?.[l.id];
        if (!li?.title) report.err(`course ${course.id}/${lang.code}: lesson ${l.id} lacks a title`);
        else useSlug("lesson", l.id, li.slug, `lesson ${l.id}/${lang.code}`);
      }
    }

    // ready lessons
    for (const l of course.lessons) {
      if (l.status !== "ready") continue;
      const meta = course.meta[l.id];
      if (!meta) { report.err(`lesson ${l.id}: status ready but no lesson meta`); continue; }
      if (!Array.isArray(meta.sources) || meta.sources.length < 2) report.err(`lesson ${l.id}: needs >= 2 independent sources in meta`);
      for (const s of meta.sources || []) if (!bibOk(s.bib)) report.err(`lesson ${l.id}: source ${s.bib} missing or not verified ok`);
      for (const pid of meta.people || []) if (!people[pid]) report.err(`lesson ${l.id}: meta person ${pid} does not exist`);
      for (const cid of meta.concepts || []) if (!concepts[cid]) report.err(`lesson ${l.id}: meta concept ${cid} does not exist`);
      const sigs = {};
      for (const lang of publishedLangs) {
        const t = i18n[lang.code]?.courses?.[course.id]?.lessons?.[l.id];
        if (!t) { report.err(`lesson ${l.id}: no text for published language ${lang.code}`); continue; }
        checkLessonText(model, course, l, meta, t, lang);
        sigs[lang.code] = lessonSignature(t);
      }
      const base = sigs[model.config.sourceLang];
      if (base) for (const [code, sig] of Object.entries(sigs)) {
        if (code !== model.config.sourceLang && sig !== base) report.err(`lesson ${l.id}: ${code} structure differs from source language (card/question parity)`);
      }
    }
  }

  // people & concept text parity/format for every published language
  for (const lang of publishedLangs) {
    const L = i18n[lang.code] || { people: {}, concepts: {} };
    const usedPeople = new Set(), usedConcepts = new Set();
    for (const course of Object.values(courses)) for (const l of course.lessons) {
      if (l.status !== "ready") continue;
      for (const p of course.meta[l.id]?.people || []) usedPeople.add(p);
      for (const c of course.meta[l.id]?.concepts || []) usedConcepts.add(c);
    }
    for (const id of Object.keys(people)) {
      const t = L.people[id];
      if (!t) { report.err(`person ${id}: no ${lang.code} text`); continue; }
      const w = `person ${id}/${lang.code}`;
      if (!t.name) report.err(`${w}: no name`);
      checkSlug(t.slug, lang, w, report);
      if (!t.short) report.err(`${w}: no short`);
      const n = words(plainText(t.bio));
      if (n < 60) report.err(`${w}: bio too short (${n} words)`);
      for (const wk of t.works || []) if (!bibOk(wk.bib)) report.err(`${w}: work ${wk.bib} missing or not verified ok`);
    }
    for (const id of Object.keys(concepts)) {
      const t = L.concepts[id];
      if (!t) { report.err(`concept ${id}: no ${lang.code} text`); continue; }
      const w = `concept ${id}/${lang.code}`;
      if (!t.term) report.err(`${w}: no term`);
      checkSlug(t.slug, lang, w, report);
      if (!t.short) report.err(`${w}: no short`);
      const n = words(plainText(t.body));
      if (n < 40) report.err(`${w}: body too short (${n} words)`);
    }
    // unique slugs per section
    for (const [kind, table] of [["person", L.people], ["concept", L.concepts]]) {
      const seen = new Map();
      for (const [id, t] of Object.entries(table)) {
        if (!t.slug) continue;
        if (seen.has(t.slug)) report.err(`${kind} slug "${t.slug}" duplicated (${id}, ${seen.get(t.slug)}) in ${lang.code}`);
        seen.set(t.slug, id);
      }
    }
    // UI parity against English
    const en = i18n.en?.ui || {};
    for (const key of Object.keys(en)) {
      if (!(key in (i18n[lang.code]?.ui || {}))) report.err(`ui: key "${key}" missing in ${lang.code}`);
    }
    // static pages
    for (const page of ["about", "privacy", "contact"]) {
      if (!i18n[lang.code]?.site?.[page]) report.err(`site page "${page}" missing in ${lang.code}`);
    }
  }
}

function checkQuestion(q, where, report, isPart = false) {
  const need = (cond, msg) => { if (!cond) report.err(`${where}: ${msg}`); };
  need(q && typeof q === "object", "question is not an object");
  if (!q || typeof q !== "object") return;
  need(typeof q.id === "string" && q.id, "question id missing");
  if (!isPart) need(QTYPES.includes(q.type), `unknown type ${q.type}`);
  const type = isPart ? "mcq" : q.type;
  const s = (v) => typeof v === "string" && v.trim().length > 0;
  need(s(q.explain) || (type === "case" && s(q.takeaway)), "explain missing");
  if (type === "mcq") {
    need(s(q.prompt), "prompt missing");
    need(Array.isArray(q.options) && q.options.length >= 3 && q.options.length <= 5 && q.options.every(s), "mcq needs 3-5 non-empty options");
    need(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < (q.options?.length || 0), "mcq answer index invalid");
    if (Array.isArray(q.options) && new Set(q.options.map((o) => String(o).trim().toLowerCase())).size !== q.options.length) report.err(`${where}: duplicate options`);
  } else if (type === "tf") {
    need(s(q.prompt), "prompt missing");
    need(typeof q.answer === "boolean", "tf answer must be boolean");
  } else if (type === "match") {
    need(s(q.prompt), "prompt missing");
    need(Array.isArray(q.pairs) && q.pairs.length >= 3 && q.pairs.length <= 6 && q.pairs.every((p) => Array.isArray(p) && p.length === 2 && s(p[0]) && s(p[1])), "match needs 3-6 pairs");
    if (Array.isArray(q.pairs)) {
      need(new Set(q.pairs.map((p) => p[1])).size === q.pairs.length, "match right sides must be unique");
      need(new Set(q.pairs.map((p) => p[0])).size === q.pairs.length, "match left sides must be unique");
    }
  } else if (type === "order") {
    need(s(q.prompt), "prompt missing");
    need(Array.isArray(q.items) && q.items.length >= 3 && q.items.length <= 7 && q.items.every(s), "order needs 3-7 items");
    if (Array.isArray(q.items)) need(new Set(q.items).size === q.items.length, "order items must be unique");
  } else if (type === "cloze") {
    need(s(q.prompt) && s(q.text), "cloze needs prompt and text");
    const marks = [...String(q.text || "").matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
    need(Array.isArray(q.blanks) && q.blanks.length >= 1 && q.blanks.length === marks.length, "cloze blanks must match {{n}} markers");
    (q.blanks || []).forEach((b, i) => {
      need(Array.isArray(b.options) && b.options.length >= 2 && b.options.every(s), `cloze blank ${i + 1} needs options`);
      need(Number.isInteger(b.answer) && b.answer >= 0 && b.answer < (b.options?.length || 0), `cloze blank ${i + 1} answer invalid`);
    });
    need(marks.every((m, i) => m === i + 1), "cloze markers must be {{1}}, {{2}}, ... in order");
  } else if (type === "case") {
    need(s(q.scenario), "case scenario missing");
    need(Array.isArray(q.parts) && q.parts.length >= 2 && q.parts.length <= 3, "case needs 2-3 parts");
    (q.parts || []).forEach((p, i) => checkQuestion({ ...p, id: p.id || `${q.id}-p${i + 1}` }, `${where}/part${i + 1}`, report, true));
    need(s(q.takeaway), "case takeaway missing");
  }
}

function lessonSignature(t) {
  const q = (x) => {
    if (!x) return "-";
    const base = x.type;
    if (x.type === "mcq") return `${base}:${x.options.length}:${x.answer}`;
    if (x.type === "tf") return `${base}:${x.answer}`;
    if (x.type === "match") return `${base}:${x.pairs.length}`;
    if (x.type === "order") return `${base}:${x.items.length}`;
    if (x.type === "cloze") return `${base}:${x.blanks.map((b) => `${b.options.length}/${b.answer}`).join(",")}`;
    if (x.type === "case") return `${base}:${x.parts.map((p) => `${p.options.length}/${p.answer}`).join(",")}`;
    return base;
  };
  const refs = (md) => collectRefs(md).map((r) => `${r.kind}:${r.id}`).sort().join("|");
  return JSON.stringify([
    (t.cards || []).map((c) => [c.id, c.section, c.layer, c.kind, q(c.question), c.question?.id || "", refs(c.body)]),
    (t.quiz || []).map((x) => [x.id, q(x)]),
  ]);
}

function checkLessonText(model, course, lesson, meta, t, lang) {
  const { report, bib, people, concepts, i18n } = model;
  const w = `lesson ${lesson.id}/${lang.code}`;
  const info = i18n[lang.code]?.courses?.[course.id]?.info?.lessons?.[lesson.id];
  if (info) {
    if (t.title !== info.title) report.err(`${w}: title differs from course.json (${t.title} vs ${info.title})`);
    if (t.slug !== info.slug) report.err(`${w}: slug differs from course.json (${t.slug} vs ${info.slug})`);
  }
  if (!t.description || t.description.length > 170) report.err(`${w}: description missing or longer than 170 chars`);
  if (!t.claim) report.err(`${w}: claim missing`);
  if (!["source", "machine", "reviewed"].includes(t.translation?.status)) report.err(`${w}: translation.status invalid`);
  if (!t.updated || !/^\d{4}-\d{2}-\d{2}$/.test(t.updated)) report.err(`${w}: updated must be YYYY-MM-DD`);
  const cards = t.cards || [];
  if (cards.filter((c) => c.layer === "core").length < 12) report.warn(`${w}: fewer than 12 core cards`);
  if (cards.filter((c) => c.layer === "deep").length < 4) report.warn(`${w}: fewer than 4 deep cards`);
  const ids = new Set();
  let lastSectionIdx = -1;
  const sectionsSeen = new Set();
  const citeOrder = new Set();
  cards.forEach((c, i) => {
    const cw = `${w} card ${c.id || i}`;
    if (!c.id || ids.has(c.id)) report.err(`${cw}: missing or duplicate id`);
    ids.add(c.id);
    const si = SECTIONS.indexOf(c.section);
    if (si < 0) report.err(`${cw}: unknown section ${c.section}`);
    else { if (si < lastSectionIdx) report.err(`${cw}: section ${c.section} out of order`); lastSectionIdx = Math.max(lastSectionIdx, si); sectionsSeen.add(c.section); }
    if (!LAYERS.has(c.layer)) report.err(`${cw}: bad layer`);
    if (!KINDS.has(c.kind)) report.err(`${cw}: bad kind ${c.kind}`);
    if (!c.title) report.err(`${cw}: no title`);
    const n = words(plainText(c.body));
    if (n < 40) report.err(`${cw}: body too short (${n} words)`);
    if (n > 420) report.warn(`${cw}: body long (${n} words)`);
    if (c.layer === "core" && !c.question) report.warn(`${cw}: core card without mini question`);
    if (c.question) checkQuestion(c.question, `${cw} question`, report);
    for (const r of collectRefs(c.body)) checkRef(r, lesson, meta, model, lang, cw, citeOrder);
  });
  for (const sec of SECTIONS) if (!sectionsSeen.has(sec) && !OPTIONAL_SECTIONS.has(sec)) report.err(`${w}: missing section ${sec}`);
  if (cards.length && cards[cards.length - 1].section !== "summary") report.err(`${w}: last card must be the summary`);
  const quiz = t.quiz || [];
  if (quiz.length < 8) report.err(`${w}: quiz needs >= 8 questions (has ${quiz.length})`);
  const qids = new Set(cards.map((c) => c.question?.id).filter(Boolean));
  const types = new Set();
  quiz.forEach((q, i) => {
    const qw = `${w} quiz ${q.id || i}`;
    if (qids.has(q.id)) report.err(`${qw}: id collides with a card question`);
    qids.add(q.id);
    checkQuestion(q, qw, report);
    types.add(q.type);
  });
  for (const ty of QTYPES) if (!types.has(ty)) report.warn(`${w}: quiz has no ${ty} question`);
  // meta lists must cover what the text cites
  for (const cid of citeOrder) if (!(meta.sources || []).some((s) => s.bib === cid)) report.err(`${w}: cites ${cid} which is not in lesson meta sources`);
}

function checkRef(r, lesson, meta, model, lang, where, citeOrder) {
  const { report, courses, people, concepts, bib, i18n } = model;
  const L = i18n[lang.code] || { people: {}, concepts: {} };
  if (r.kind === "person") {
    if (!people[r.id]) report.err(`${where}: [[person:${r.id}]] does not exist`);
    else if (!L.people[r.id] && lang.status !== "planned") report.err(`${where}: person ${r.id} has no ${lang.code} text`);
  } else if (r.kind === "concept") {
    if (!concepts[r.id]) report.err(`${where}: [[concept:${r.id}]] does not exist`);
    else if (!L.concepts[r.id] && lang.status !== "planned") report.err(`${where}: concept ${r.id} has no ${lang.code} text`);
  } else if (r.kind === "lesson") {
    const ok = Object.values(courses).some((c) => c.lessonById[r.id]);
    if (!ok) report.err(`${where}: [[lesson:${r.id}]] does not exist`);
  } else if (r.kind === "cite") {
    citeOrder.add(r.id);
    if (!bib[r.id]) report.err(`${where}: [[cite:${r.id}]] not in bibliography`);
    else if (bib[r.id].verified?.status !== "ok") report.err(`${where}: cited source ${r.id} is not verified ok`);
  }
}

export { slugAscii };
