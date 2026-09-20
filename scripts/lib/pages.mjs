// Page renderers. Each returns a page descriptor consumed by layout() in site.mjs. All body text is static HTML:
// nothing here depends on JavaScript to be readable.
import { esc, plainText, words } from "./util.mjs";
import { SECTIONS } from "./content.mjs";
import { md, mdContext, formatBib, breadcrumbLd, APP_VIEWS } from "./site.mjs";
import { render as renderMd } from "./markdown.mjs";

const AUTHOR = (cx) => ({ "@type": "Person", name: cx.config.author.name, url: cx.config.author.url });

function crumbs(cx, items) {
  const html = "";
  return { html, ld: breadcrumbLd(cx, items.map((it) => ({ name: it.name, url: it.url || cx.url() }))) };
}

// ---------------------------------------------------------------------------
// questions
// ---------------------------------------------------------------------------
const deepPlain = (v) => (typeof v === "string" ? plainText(v) : Array.isArray(v) ? v.map(deepPlain) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepPlain(x)])) : v);
export const plainQuestion = (q) => deepPlain(q);

function letter(i) { return String.fromCharCode(65 + i); }

function staticMcq(cx, q) {
  const T = cx.t;
  return `<p><strong>${esc(q.prompt)}</strong></p><ol type="A">${q.options.map((o) => `<li>${esc(o)}</li>`).join("")}</ol><p><strong>${esc(T("q.answer"))}</strong> ${letter(q.answer)}) ${esc(q.options[q.answer])}</p><p>${esc(q.explain || "")}</p>`;
}

export function staticQuestion(cx, q, label) {
  const T = cx.t;
  let inner = "";
  if (q.type === "mcq") inner = staticMcq(cx, q);
  else if (q.type === "tf") inner = `<p><strong>${esc(q.prompt)}</strong></p><p><strong>${esc(T("q.answer"))}</strong> ${esc(q.answer ? T("q.true") : T("q.false"))}</p><p>${esc(q.explain)}</p>`;
  else if (q.type === "match") inner = `<p><strong>${esc(q.prompt)}</strong></p><ul>${q.pairs.map((p) => `<li>${esc(p[0])} — ${esc(p[1])}</li>`).join("")}</ul><p>${esc(q.explain)}</p>`;
  else if (q.type === "order") inner = `<p><strong>${esc(q.prompt)}</strong></p><ol>${q.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ol><p>${esc(q.explain)}</p>`;
  else if (q.type === "cloze") {
    const filled = q.text.replace(/\{\{(\d+)\}\}/g, (m, n) => { const b = q.blanks[Number(n) - 1]; return `<strong>${esc(b.options[b.answer])}</strong>`; });
    inner = `<p><strong>${esc(q.prompt)}</strong></p><p>${esc(q.text).replace(/\{\{(\d+)\}\}/g, "(…$1…)")}</p><p><strong>${esc(T("q.answer"))}</strong> ${filled.split(/(<strong>.*?<\/strong>)/).map((x) => (x.startsWith("<strong>") ? x : esc(x))).join("")}</p><p>${esc(q.explain)}</p>`;
  } else if (q.type === "case") {
    inner = `<p class="q-scenario">${esc(q.scenario)}</p>${q.parts.map((p) => staticMcq(cx, p)).join("")}<p><strong>${esc(T("q.takeaway"))}</strong> ${esc(q.takeaway)}</p>`;
  }
  return `<details class="q-static" data-q="${esc(q.id)}"><summary>${esc(label)}</summary>${inner}</details>`;
}

// ---------------------------------------------------------------------------
// shared bits
// ---------------------------------------------------------------------------
export function lessonUrl(cx, course, lessonId) {
  const info = cx.model.i18n[cx.lang.code].courses[course.id].info;
  return cx.url(info.slug, info.lessons[lessonId].slug);
}
export function courseUrl(cx, course) {
  return cx.url(cx.model.i18n[cx.lang.code].courses[course.id].info.slug);
}
const famClass = (color) => `fam-${color}`;

function lessonsUsing(cx, kind, id) {
  const out = [];
  for (const course of Object.values(cx.model.courses)) {
    for (const l of course.lessons) {
      if (l.status !== "ready") continue;
      const meta = course.meta[l.id];
      if ((kind === "person" ? meta.people : meta.concepts)?.includes(id)) out.push({ course, lesson: l });
    }
  }
  return out;
}

function unitOf(course, lesson) {
  return course.unitById[lesson.unit];
}

// ---------------------------------------------------------------------------
// lesson page
// ---------------------------------------------------------------------------
export function buildLessonPayload(cx, course, lesson, text) {
  const cards = {};
  for (const c of text.cards) if (c.question) cards[c.id] = plainQuestion(c.question);
  return {
    v: 1, course: course.id, lesson: lesson.id, unit: lesson.unit, title: text.title, minutes: lesson.minutes,
    cards, quiz: (text.quiz || []).map(plainQuestion),
    order: text.cards.map((c) => ({ id: c.id, layer: c.layer, kind: c.kind, section: c.section, title: plainText(c.title) })),
  };
}

export function lessonPage(cx, course, lesson) {
  const { model, lang, t } = cx;
  const L = model.i18n[lang.code];
  const info = L.courses[course.id].info;
  const text = L.courses[course.id].lessons[lesson.id];
  const meta = course.meta[lesson.id];
  const unit = unitOf(course, lesson);
  const unitInfo = info.units[unit.id];
  const url = lessonUrl(cx, course, lesson.id);
  const citeMap = new Map();
  const missing = [];
  const mdc = { courseId: course.id, citeMap, missing };
  const tocItems = [];
  let bodyHtml = "";
  let current = null;
  const closeSection = () => { if (current) bodyHtml += "</section>\n"; current = null; };
  for (const c of text.cards) {
    if (c.section !== current) {
      closeSection();
      current = c.section;
      bodyHtml += `<section class="lesson-section" data-section="${c.section}" aria-labelledby="s-${c.section}"><h2 id="s-${c.section}">${esc(t("section." + c.section))}</h2>\n`;
    }
    const inner = md(cx, c.body, mdc);
    const q = ""; // questions live in the separate Questions area, never inside a lesson
    const kindLabel = c.layer === "deep" ? t("kind.deep") : t("kind." + c.kind);
    tocItems.push({ id: c.id, title: c.title, layer: c.layer });
    if (c.layer === "deep") {
      bodyHtml += `<details class="card" id="c-${esc(c.id)}" data-card="${esc(c.id)}" data-layer="deep" data-kind="${c.kind}" data-section="${c.section}"><summary><span class="card-kind">${esc(kindLabel)}</span> <h3 style="display:inline;margin:0;font-size:1.05rem">${esc(plainText(c.title))}</h3></summary>\n${inner}\n${q}</details>\n`;
    } else {
      bodyHtml += `<section class="card" id="c-${esc(c.id)}" data-card="${esc(c.id)}" data-layer="core" data-kind="${c.kind}" data-section="${c.section}" aria-labelledby="h-${esc(c.id)}"><p class="card-kind">${esc(kindLabel)}</p><h3 id="h-${esc(c.id)}">${esc(plainText(c.title))}</h3>\n${inner}\n${q}</section>\n`;
    }
  }
  closeSection();

  // references
  const cited = [...citeMap.entries()].sort((a, b) => a[1] - b[1]);
  const citedIds = new Set(cited.map(([id]) => id));
  const refsHtml = cited.map(([id, n]) => `<li id="ref-${n}">${formatBib(model.bib[id])}</li>`).join("");
  const also = (meta.sources || []).filter((s) => !citedIds.has(s.bib)).map((s) => `<li>${formatBib(model.bib[s.bib])}</li>`).join("");

  // prerequisites, pager
  const prereqLinks = (lesson.prereq || []).map((p) => `<a href="${esc(lessonUrl(cx, course, p))}">${esc(info.lessons[p].title)}</a>`).join(", ");
  const idx = lesson.index;
  const prev = course.lessons[idx - 1], next = course.lessons[idx + 1];
  const practice = `<p class="callout"><a class="btn btn-primary" href="${esc(cx.url("app", "review"))}?lesson=${esc(lesson.id)}">${esc(t("lesson.practice"))}</a> <span class="small muted">${esc(t("lesson.practice-hint"))}</span></p>`;
  const pager = `<nav class="pager" aria-label="${esc(t("lesson.pager"))}">${prev ? `<a href="${esc(lessonUrl(cx, course, prev.id))}" rel="prev"><small>${esc(t("lesson.prev"))}</small>${esc(info.lessons[prev.id].title)}</a>` : "<span></span>"}${next ? `<a href="${esc(lessonUrl(cx, course, next.id))}" rel="next"><small>${esc(t("lesson.next"))}</small>${esc(info.lessons[next.id].title)}</a>` : ""}</nav>`;

  const peopleLinks = (meta.people || []).map((id) => L.people[id] ? `<li><a class="ref ref-person" data-ref="person:${id}" href="${esc(cx.url(cx.seg("url.people"), L.people[id].slug))}">${esc(L.people[id].name)}</a></li>` : "").join("");
  const conceptLinks = (meta.concepts || []).map((id) => L.concepts[id] ? `<li><a class="ref ref-concept" data-ref="concept:${id}" href="${esc(cx.url(cx.seg("url.glossary"), L.concepts[id].slug))}">${esc(L.concepts[id].term)}</a></li>` : "").join("");

  const listInline = (items) => `<ul>${items}</ul>`;
  const infobox = `<aside class="infobox" aria-labelledby="ib-h"><h2 id="ib-h">${esc(t("lesson.in-lesson"))}</h2><dl>${prereqLinks ? `<dt>${esc(t("lesson.prereqs"))}</dt><dd>${prereqLinks}</dd>` : ""}${peopleLinks ? `<dt>${esc(t("lesson.people"))}</dt><dd>${listInline(peopleLinks)}</dd>` : ""}${conceptLinks ? `<dt>${esc(t("lesson.concepts"))}</dt><dd>${listInline(conceptLinks)}</dd>` : ""}<dt>${esc(t("lesson.references"))}</dt><dd><a href="#references">${esc(t("lesson.jump-refs"))}</a></dd></dl></aside>`;
  const tocHtml = `<details class="toc"><summary>${esc(t("lesson.toc"))}</summary><ol>${tocItems.map((i) => `<li><a href="#c-${esc(i.id)}">${esc(plainText(i.title))}</a>${i.layer === "deep" ? ` <span class="small muted">(${esc(t("kind.deep"))})</span>` : ""}</li>`).join("")}</ol></details>`;

  const payload = buildLessonPayload(cx, course, lesson, text);
  const bc = crumbs(cx, [
    { name: t("bc.home"), url: cx.url() },
    { name: info.title, url: courseUrl(cx, course) },
    { name: text.title, url },
  ]);
  const minutesText = t("lesson.minutes", { n: lesson.minutes });
  const body = `<div class="container reading ${famClass(unit.color)}">
${bc.html}
<article class="lesson" data-course="${esc(course.id)}" data-lesson="${esc(lesson.id)}" data-unit="${esc(unit.id)}" lang="${esc(lang.code)}">
<header class="lesson-header">
<p class="eyebrow">${esc(t("lesson.unit", { n: unit.index + 1 + 0, title: unitInfo.title }))}</p>
<h1>${esc(text.title)}</h1>
<p class="lead">${esc(plainText(text.claim))}</p>
<ul class="lesson-meta"><li>${esc(minutesText)}</li><li>${esc(t("lesson.updated", { date: cx.dateFmt(text.updated) }))}</li></ul>
</header>
<div id="reader-mount"></div>
${infobox}
${tocHtml}
<div id="lesson-body">
${bodyHtml}
</div>
<section id="references" aria-labelledby="refs-h"><h2 id="refs-h">${esc(t("lesson.references"))}</h2>
<ol class="reference-list">${refsHtml}</ol>
${also ? `<h3>${esc(t("lesson.also-consulted"))}</h3><ul>${also}</ul>` : ""}
</section>
<p class="small muted">${esc(t("lesson.method-note"))} <a href="${esc(cx.url(cx.seg("url.about")))}">${esc(t("footer.how"))}</a></p>
${practice}
${pager}
</article>
</div>`;

  const bibForLd = (meta.sources || []).map((s) => model.bib[s.bib]).filter(Boolean);
  const ld = [
    bc.ld,
    {
      "@context": "https://schema.org",
      "@type": ["Article", "LearningResource"],
      headline: text.title,
      name: text.title,
      description: text.description,
      inLanguage: lang.code,
      url: cx.abs(url),
      mainEntityOfPage: cx.abs(url),
      author: AUTHOR(cx),
      publisher: AUTHOR(cx),
      datePublished: text.updated,
      dateModified: text.updated,
      learningResourceType: "lesson",
      educationalLevel: "University",
      timeRequired: `PT${lesson.minutes}M`,
      isAccessibleForFree: true,
      isPartOf: { "@type": "Course", name: info.title, url: cx.abs(courseUrl(cx, course)) },
      teaches: (meta.concepts || []).map((id) => L.concepts[id]?.term).filter(Boolean),
      about: (meta.concepts || []).map((id) => L.concepts[id] && ({ "@type": "DefinedTerm", name: L.concepts[id].term, url: cx.abs(cx.url(cx.seg("url.glossary"), L.concepts[id].slug)) })).filter(Boolean),
      citation: bibForLd.map((b) => ({ "@type": "CreativeWork", name: b.title, datePublished: String(b.originalYear && b.type === "book" ? b.year : b.year), author: (b.authors || []).map((a) => ({ "@type": "Person", name: a })) })),
    },
  ];
  return {
    key: `lesson:${course.id}/${lesson.id}`, kind: "lesson", lang, path: url, title: `${text.title} · ${info.title} | ${cx.config.name}`,
    description: text.description, robots: "index", body, pageType: "lesson", ld, ogType: "article", nav: "courses", lastUpdated: text.updated,
    translationStatus: text.translation.status, dataAttrs: { "data-course": course.id, "data-lesson": lesson.id }, missing,
  };
}

export function lessonStubPage(cx, course, lesson) {
  const { model, lang, t } = cx;
  const info = model.i18n[lang.code].courses[course.id].info;
  const li = info.lessons[lesson.id];
  const unit = unitOf(course, lesson);
  const url = lessonUrl(cx, course, lesson.id);
  const bc = crumbs(cx, [{ name: t("bc.home"), url: cx.url() }, { name: info.title, url: courseUrl(cx, course) }, { name: li.title, url }]);
  const prereq = (lesson.prereq || []).map((p) => `<li><a href="${esc(lessonUrl(cx, course, p))}">${esc(info.lessons[p].title)}</a></li>`).join("");
  const body = `<div class="container reading ${famClass(unit.color)}">${bc.html}
<article class="lesson-header" data-lesson="${esc(lesson.id)}" data-course="${esc(course.id)}">
<p class="eyebrow">${esc(t("lesson.unit", { n: unit.index + 1, title: info.units[unit.id].title }))}</p>
<h1>${esc(li.title)}</h1>
<p class="notice" role="note">${esc(t("lesson.planned-body"))}</p>
<ul class="lesson-meta"><li>${esc(t("lesson.minutes", { n: lesson.minutes }))}</li></ul>
${prereq ? `<h2>${esc(t("lesson.prereqs"))}</h2><ul>${prereq}</ul>` : ""}
<p><a class="btn" href="${esc(courseUrl(cx, course))}">${esc(t("lesson.back-to-course"))}</a></p>
</article></div>`;
  return { key: `lesson:${course.id}/${lesson.id}`, kind: "lesson-stub", lang, path: url, title: `${li.title} · ${info.title} | ${cx.config.name}`, description: t("lesson.planned-desc", { title: li.title, course: info.title }), robots: "noindex", body, pageType: "lesson-stub", ld: [bc.ld], nav: "courses", dataAttrs: { "data-course": course.id, "data-lesson": lesson.id } };
}

// ---------------------------------------------------------------------------
// course + home
// ---------------------------------------------------------------------------
export function coursePage(cx, course) {
  const { model, lang, t } = cx;
  const info = model.i18n[lang.code].courses[course.id].info;
  const url = courseUrl(cx, course);
  const total = course.lessons.reduce((a, l) => a + l.minutes, 0);
  const ready = course.lessons.filter((l) => l.status === "ready").length;
  const bc = crumbs(cx, [{ name: t("bc.home"), url: cx.url() }, { name: info.title, url }]);
  const units = course.units.map((u, ui) => {
    const uinfo = info.units[u.id];
    const items = u.lessons.map((l, i) => {
      const li = info.lessons[l.id];
      const rec = course.lessonById[l.id];
      const state = l.status === "ready" ? t("state.available") : t("state.planned");
      return `<li class="lesson-item" data-lesson="${esc(l.id)}" data-prereq="${esc((l.prereq || []).join(" "))}" data-status="${l.status}" data-state="${l.status === "ready" ? "open" : "planned"}"><span class="num">${rec.index + 1}.</span><a href="${esc(lessonUrl(cx, course, l.id))}">${esc(li.title)}</a><span class="badge">${esc(t("lesson.minutes", { n: l.minutes }))}</span><span class="state" data-role="state">${esc(state)}</span></li>`;
    }).join("");
    return `<section class="unit ${famClass(u.color)}" id="unit-${esc(u.id)}" aria-labelledby="u-${esc(u.id)}" data-unit="${esc(u.id)}"><p class="eyebrow">${esc(t("lesson.unit-short", { n: ui + 1 }))}</p><h2 id="u-${esc(u.id)}">${esc(uinfo.title)}</h2><ul class="lesson-list">${items}</ul></section>`;
  }).join("\n");
  const body = `<div class="container">${bc.html}
<header class="hero"><p class="eyebrow">${esc(t("course.eyebrow"))}</p><h1>${esc(info.title)}</h1><p class="lead">${esc(info.description)}</p>
<ul class="lesson-meta"><li>${esc(t("course.n-units", { n: course.units.length }))}</li><li>${esc(t("course.n-lessons", { n: course.lessons.length }))}</li><li>${esc(t("course.n-hours", { n: Math.round(total / 60) }))}</li><li>${esc(t("course.n-ready", { n: ready, total: course.lessons.length }))}</li></ul>
<div class="btn-row js-only"><a class="btn btn-primary" id="continue-link" data-course="${esc(course.id)}" href="#" hidden></a></div>
</header>
<div id="course-map" data-course="${esc(course.id)}">
${units}
</div>
</div>`;
  const ld = [bc.ld, {
    "@context": "https://schema.org", "@type": "Course", name: info.title, description: info.description, inLanguage: lang.code, url: cx.abs(url),
    provider: AUTHOR(cx), author: AUTHOR(cx), isAccessibleForFree: true, educationalLevel: "University",
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: `PT${Math.round(total / 60)}H` },
    hasPart: course.lessons.filter((l) => l.status === "ready").map((l) => ({ "@type": "LearningResource", name: info.lessons[l.id].title, url: cx.abs(lessonUrl(cx, course, l.id)) })),
  }];
  return { key: `course:${course.id}`, kind: "course", lang, path: url, title: `${info.title} | ${cx.config.name}`, description: info.description, robots: "index", body, pageType: "course", ld, nav: "courses", dataAttrs: { "data-course": course.id } };
}

export function homePage(cx) {
  const { model, lang, t, config } = cx;
  const L = model.i18n[lang.code];
  const course = Object.values(model.courses)[0];
  const cinfo = L.courses[course.id].info;
  const total = course.lessons.reduce((a, l) => a + l.minutes, 0);
  const item = (href, title, what) => `<li><a href="${esc(href)}"><span>${esc(title)}</span><span class="what">${esc(what)}</span></a></li>`;
  const index = [
    item(courseUrl(cx, course), cinfo.title, t("idx.course", { lessons: course.lessons.length, hours: Math.round(total / 60) })),
    item(cx.url(cx.seg("url.people")), t("nav.people"), t("idx.people")),
    item(cx.url(cx.seg("url.glossary")), t("nav.glossary"), t("idx.glossary")),
    item(cx.url(cx.seg("url.timeline")), t("nav.timeline"), t("idx.timeline")),
    item(cx.url("app", "study"), t("nav.study"), t("idx.study")),
    item(cx.url("app", "review"), t("app.review.title"), t("idx.review")),
    item(cx.url("app", "exam"), t("app.exam.title"), t("idx.exam")),
    item(cx.url("app", "stats"), t("app.stats.title"), t("idx.stats")),
    item(cx.url("app", "settings"), t("nav.settings"), t("idx.settings")),
    item(cx.url("app", "account"), t("app.account.title"), t("idx.account")),
    item(cx.url(cx.seg("url.about")), t("nav.about"), t("idx.about")),
  ].join("");
  const features = [1, 2, 3, 4, 5, 6].map((i) => `<li><strong>${esc(t("home.f" + i + ".t"))}</strong> ${esc(t("home.f" + i + ".d"))}</li>`).join("");
  const body = `<div class="container reading">
<header class="hero"><p class="eyebrow">${esc(t("site.tagline"))}</p><h1>${esc(t("home.title"))}</h1><p class="lead">${esc(t("home.lead"))}</p>
<div class="btn-row"><a class="btn btn-primary js-only" id="continue-link" href="#" hidden></a></div></header>
<section aria-labelledby="idx-h"><h2 id="idx-h">${esc(t("idx.title"))}</h2><ul class="index-list">${index}</ul></section>
<div id="daily-tip" class="js-only" hidden></div>
<section aria-labelledby="how-h"><h2 id="how-h">${esc(t("home.how"))}</h2><ul>${features}</ul></section>
</div>`;
  const ld = [{ "@context": "https://schema.org", "@type": "WebSite", name: config.name, url: cx.abs(cx.url()), inLanguage: lang.code, description: t("home.lead"), author: AUTHOR(cx), publisher: AUTHOR(cx) }];
  return { key: "home", kind: "home", lang, path: cx.url(), title: t("home.meta-title", { name: config.name }), description: t("home.lead"), robots: "index", body, pageType: "home", ld, nav: "courses" };
}

// ---------------------------------------------------------------------------
// people / concepts / timeline
// ---------------------------------------------------------------------------
function lifespan(cx, pf, pt) {
  const b = pf.born?.year, d = pf.died?.year;
  if (b && d) return cx.t("person.lifespan-range", { born: b, died: d });
  if (b) return cx.t("person.lifespan-born", { born: b });
  return "";
}

export function personPage(cx, id) {
  const { model, lang, t } = cx;
  const L = model.i18n[lang.code];
  const pf = model.people[id], pt = L.people[id];
  const url = cx.url(cx.seg("url.people"), pt.slug);
  const missing = [];
  const bio = md(cx, pt.bio, { missing });
  const inCourse = pt.inCourse ? md(cx, pt.inCourse, { missing }) : "";
  const uses = lessonsUsing(cx, "person", id);
  const usesHtml = uses.map(({ course, lesson }) => `<li><a href="${esc(lessonUrl(cx, course, lesson.id))}">${esc(L.courses[course.id].info.lessons[lesson.id].title)}</a></li>`).join("");
  const works = (pt.works || []).map((w) => `<li>${formatBib(model.bib[w.bib])}${w.note ? ` — ${esc(plainText(w.note))}` : ""}</li>`).join("");
  const sources = (pf.sources || []).map((s) => `<li>${formatBib(model.bib[s])}</li>`).join("");
  const concepts = Object.values(model.concepts).filter((c) => (c.introducedBy || []).includes(id) && L.concepts[c.id]).map((c) => `<li><a href="${esc(cx.url(cx.seg("url.glossary"), L.concepts[c.id].slug))}">${esc(L.concepts[c.id].term)}</a></li>`).join("");
  const life = lifespan(cx, pf);
  const places = [pt.born && t("person.born-in", { place: pt.born }), pt.died && t("person.died-in", { place: pt.died })].filter(Boolean).join(" · ");
  const bc = crumbs(cx, [{ name: t("bc.home"), url: cx.url() }, { name: t("people.title"), url: cx.url(cx.seg("url.people")) }, { name: pt.name, url }]);
  const body = `<div class="container reading">${bc.html}
<article data-person="${esc(id)}" lang="${esc(lang.code)}">
<header class="lesson-header" style="--fam:var(--f-slate)"><p class="eyebrow">${esc(t("person.eyebrow"))}</p><h1>${esc(pt.name)}</h1>${pt.nativeName ? `<p class="muted" lang="${esc(pt.nativeLang || lang.code)}">${esc(pt.nativeName)}</p>` : ""}<p class="lead">${esc(plainText(pt.short))}</p>
<ul class="lesson-meta">${life ? `<li>${esc(life)}</li>` : ""}${places ? `<li>${esc(places)}</li>` : ""}${(pt.roles || []).map((r) => `<li>${esc(r)}</li>`).join("")}</ul></header>
<section aria-labelledby="bio-h"><h2 id="bio-h">${esc(t("person.bio"))}</h2>${bio}</section>
${inCourse ? `<section aria-labelledby="inc-h"><h2 id="inc-h">${esc(t("person.in-course"))}</h2>${inCourse}</section>` : ""}
${works ? `<section aria-labelledby="works-h"><h2 id="works-h">${esc(t("person.works"))}</h2><ul>${works}</ul></section>` : ""}
${usesHtml ? `<section aria-labelledby="uses-h"><h2 id="uses-h">${esc(t("person.lessons"))}</h2><ul class="panel-lessons">${usesHtml}</ul></section>` : ""}
${concepts ? `<section aria-labelledby="c-h"><h2 id="c-h">${esc(t("person.concepts"))}</h2><ul>${concepts}</ul></section>` : ""}
<section aria-labelledby="src-h"><h2 id="src-h">${esc(t("person.sources"))}</h2><ul>${sources}</ul></section>
</article></div>`;
  const ld = [bc.ld, {
    "@context": "https://schema.org", "@type": "ProfilePage", url: cx.abs(url), inLanguage: lang.code, name: pt.name,
    mainEntity: { "@type": "Person", name: pt.name, description: plainText(pt.short), ...(pf.born?.year ? { birthDate: String(pf.born.year) } : {}), ...(pf.died?.year ? { deathDate: String(pf.died.year) } : {}), url: cx.abs(url) },
  }];
  return { key: `person:${id}`, kind: "person", lang, path: url, title: `${pt.name} — ${t("person.who")} | ${cx.config.name}`, description: plainText(pt.short).slice(0, 200), robots: "index", body, pageType: "person", ld, ogType: "profile", nav: "people", lastUpdated: pt.updated || null, translationStatus: pt.translation?.status || (lang.status === "source" ? "source" : "machine"), missing };
}

export function conceptPage(cx, id) {
  const { model, lang, t } = cx;
  const L = model.i18n[lang.code];
  const cf = model.concepts[id], ct = L.concepts[id];
  const url = cx.url(cx.seg("url.glossary"), ct.slug);
  const missing = [];
  const body1 = md(cx, ct.body, { missing });
  const example = ct.example ? md(cx, ct.example, { missing }) : "";
  const uses = lessonsUsing(cx, "concept", id);
  const usesHtml = uses.map(({ course, lesson }) => `<li><a href="${esc(lessonUrl(cx, course, lesson.id))}">${esc(L.courses[course.id].info.lessons[lesson.id].title)}</a></li>`).join("");
  const by = (cf.introducedBy || []).filter((p) => L.people[p]).map((p) => `<li><a class="ref ref-person" data-ref="person:${p}" href="${esc(cx.url(cx.seg("url.people"), L.people[p].slug))}">${esc(L.people[p].name)}</a></li>`).join("");
  const rel = (cf.related || []).filter((r) => L.concepts[r]).map((r) => `<li><a class="ref ref-concept" data-ref="concept:${r}" href="${esc(cx.url(cx.seg("url.glossary"), L.concepts[r].slug))}">${esc(L.concepts[r].term)}</a></li>`).join("");
  const sources = (cf.sources || []).map((s) => `<li>${formatBib(model.bib[s])}</li>`).join("");
  const bc = crumbs(cx, [{ name: t("bc.home"), url: cx.url() }, { name: t("glossary.title"), url: cx.url(cx.seg("url.glossary")) }, { name: ct.term, url }]);
  const enTerm = model.i18n.en?.concepts?.[id]?.term;
  const body = `<div class="container reading">${bc.html}
<article data-concept="${esc(id)}" lang="${esc(lang.code)}">
<header class="lesson-header" style="--fam:var(--f-teal)"><p class="eyebrow">${esc(t("concept.eyebrow"))}</p><h1>${esc(ct.term)}</h1>${enTerm && lang.code !== "en" ? `<p class="muted" lang="en">${esc(enTerm)}</p>` : ""}<p class="lead">${esc(plainText(ct.short))}</p></header>
${body1}
${example ? `<section aria-labelledby="ex-h"><h2 id="ex-h">${esc(t("concept.example"))}</h2>${example}</section>` : ""}
${by ? `<section aria-labelledby="by-h"><h2 id="by-h">${esc(t("concept.introduced-by"))}</h2><ul>${by}</ul></section>` : ""}
${usesHtml ? `<section aria-labelledby="l-h"><h2 id="l-h">${esc(t("concept.lessons"))}</h2><ul class="panel-lessons">${usesHtml}</ul></section>` : ""}
${rel ? `<section aria-labelledby="r-h"><h2 id="r-h">${esc(t("concept.related"))}</h2><ul>${rel}</ul></section>` : ""}
${sources ? `<section aria-labelledby="s-h"><h2 id="s-h">${esc(t("concept.sources"))}</h2><ul>${sources}</ul></section>` : ""}
</article></div>`;
  const ld = [bc.ld, { "@context": "https://schema.org", "@type": "DefinedTerm", name: ct.term, description: plainText(ct.short), inLanguage: lang.code, url: cx.abs(url), inDefinedTermSet: { "@type": "DefinedTermSet", name: t("glossary.title"), url: cx.abs(cx.url(cx.seg("url.glossary"))) } }];
  return { key: `concept:${id}`, kind: "concept", lang, path: url, title: t("concept.title", { term: ct.term, name: cx.config.name }), description: plainText(ct.short).slice(0, 200), robots: "index", body, pageType: "concept", ld, nav: "glossary", translationStatus: ct.translation?.status || (lang.status === "source" ? "source" : "machine"), missing };
}

export function peopleIndexPage(cx) {
  const { model, lang, t } = cx;
  const L = model.i18n[lang.code];
  const items = Object.keys(model.people).filter((id) => L.people[id]).sort((a, b) => cx.collator.compare(L.people[a].name, L.people[b].name));
  const list = items.map((id) => `<li class="tile fam-slate"><h2><a class="stretch ref ref-person" data-ref="person:${id}" href="${esc(cx.url(cx.seg("url.people"), L.people[id].slug))}">${esc(L.people[id].name)}</a></h2><p>${esc(plainText(L.people[id].short))}</p></li>`).join("");
  const url = cx.url(cx.seg("url.people"));
  const bc = crumbs(cx, [{ name: t("bc.home"), url: cx.url() }, { name: t("people.title"), url }]);
  const body = `<div class="container">${bc.html}<header class="hero"><h1>${esc(t("people.title"))}</h1><p class="lead">${esc(t("people.intro"))}</p></header>${items.length ? `<ul class="tiles">${list}</ul>` : `<p class="notice">${esc(t("empty.people"))}</p>`}</div>`;
  return { key: "people", kind: "people", lang, path: url, title: `${t("people.title")} | ${cx.config.name}`, description: t("people.intro"), robots: items.length ? "index" : "noindex", body, pageType: "people", ld: [bc.ld], nav: "people" };
}

export function glossaryIndexPage(cx) {
  const { model, lang, t } = cx;
  const L = model.i18n[lang.code];
  const items = Object.keys(model.concepts).filter((id) => L.concepts[id]).sort((a, b) => cx.collator.compare(L.concepts[a].term, L.concepts[b].term));
  const list = items.map((id) => `<li><a class="ref ref-concept" data-ref="concept:${id}" href="${esc(cx.url(cx.seg("url.glossary"), L.concepts[id].slug))}"><strong>${esc(L.concepts[id].term)}</strong></a> — ${esc(plainText(L.concepts[id].short))}</li>`).join("");
  const url = cx.url(cx.seg("url.glossary"));
  const bc = crumbs(cx, [{ name: t("bc.home"), url: cx.url() }, { name: t("glossary.title"), url }]);
  const body = `<div class="container reading">${bc.html}<header class="hero"><h1>${esc(t("glossary.title"))}</h1><p class="lead">${esc(t("glossary.intro"))}</p></header>${items.length ? `<ul>${list}</ul>` : `<p class="notice">${esc(t("empty.concepts"))}</p>`}</div>`;
  const ld = [bc.ld, { "@context": "https://schema.org", "@type": "DefinedTermSet", name: t("glossary.title"), url: cx.abs(url), inLanguage: lang.code, hasDefinedTerm: items.map((id) => ({ "@type": "DefinedTerm", name: L.concepts[id].term, url: cx.abs(cx.url(cx.seg("url.glossary"), L.concepts[id].slug)) })) }];
  return { key: "glossary", kind: "glossary", lang, path: url, title: `${t("glossary.title")} | ${cx.config.name}`, description: t("glossary.intro"), robots: items.length ? "index" : "noindex", body, pageType: "glossary", ld, nav: "glossary" };
}

export function timelinePage(cx) {
  const { model, lang, t } = cx;
  const L = model.i18n[lang.code];
  const rows = [];
  for (const course of Object.values(model.courses)) for (const l of course.lessons) {
    if (l.status !== "ready") continue;
    const meta = course.meta[l.id];
    const labels = L.courses[course.id].lessons[l.id]?.timeline || {};
    for (const ev of meta.timeline || []) {
      if (!labels[ev.id] || !Number.isInteger(ev.year)) continue;
      rows.push({ year: ev.year, html: `${esc(plainText(labels[ev.id]))} — <a href="${esc(lessonUrl(cx, course, l.id))}">${esc(L.courses[course.id].info.lessons[l.id].title)}</a>` });
    }
    for (const s of meta.sources || []) {
      if (s.role !== "primary") continue;
      const b = model.bib[s.bib];
      if (!b?.year) continue;
      rows.push({ year: b.originalYear || b.year, html: `${esc(t("timeline.work"))}: ${formatBib(b)} — <a href="${esc(lessonUrl(cx, course, l.id))}">${esc(L.courses[course.id].info.lessons[l.id].title)}</a>` });
    }
  }
  for (const id of Object.keys(model.people)) {
    const pf = model.people[id], pt = L.people[id];
    if (!pt || !pf.born?.year) continue;
    rows.push({ year: pf.born.year, html: `${esc(t("timeline.born"))}: <a href="${esc(cx.url(cx.seg("url.people"), pt.slug))}">${esc(pt.name)}</a>` });
    if (pf.died?.year) rows.push({ year: pf.died.year, html: `${esc(t("timeline.died"))}: <a href="${esc(cx.url(cx.seg("url.people"), pt.slug))}">${esc(pt.name)}</a>` });
  }
  rows.sort((a, b) => a.year - b.year);
  const url = cx.url(cx.seg("url.timeline"));
  const bc = crumbs(cx, [{ name: t("bc.home"), url: cx.url() }, { name: t("timeline.title"), url }]);
  const body = `<div class="container reading">${bc.html}<header class="hero"><h1>${esc(t("timeline.title"))}</h1><p class="lead">${esc(t("timeline.intro"))}</p></header>${rows.length ? `<ol class="timeline" style="list-style:none;padding:0">${rows.map((r) => `<li style="margin-block:.7rem"><strong class="nowrap">${r.year}</strong> — ${r.html}</li>`).join("")}</ol>` : `<p class="notice">${esc(t("empty.timeline"))}</p>`}</div>`;
  return { key: "timeline", kind: "timeline", lang, path: url, title: `${t("timeline.title")} | ${cx.config.name}`, description: t("timeline.intro"), robots: rows.length ? "index" : "noindex", body, pageType: "timeline", ld: [bc.ld], nav: "timeline" };
}

// ---------------------------------------------------------------------------
// static + app pages
// ---------------------------------------------------------------------------
export function staticPage(cx, id) {
  const { model, lang, t } = cx;
  const page = model.i18n[lang.code].site[id];
  const url = cx.url(cx.seg("url." + id));
  const missing = [];
  const bc = crumbs(cx, [{ name: t("bc.home"), url: cx.url() }, { name: page.title, url }]);
  const extra = id === "contact"
    ? `<ul><li><a href="${esc(cx.config.contentIssueUrl)}" rel="noopener noreferrer">${esc(t("contact.content"))}</a></li><li><a href="${esc(cx.config.translationFixUrl)}" rel="noopener noreferrer">${esc(t("translation.fix"))}</a></li><li><a href="${esc(cx.config.repo)}" rel="noopener noreferrer">${esc(t("footer.source"))}</a></li></ul>` : "";
  const body = `<div class="container reading">${bc.html}<article><h1>${esc(page.title)}</h1>${md(cx, page.body, { missing })}${extra}</article></div>`;
  return { key: id, kind: "static", lang, path: url, title: `${page.title} | ${cx.config.name}`, description: page.description || page.title, robots: "index", body, pageType: id, ld: [bc.ld], nav: id === "about" ? "about" : undefined, lastUpdated: page.updated || null, missing };
}

export function appPage(cx, view) {
  const { lang, t } = cx;
  const url = cx.url("app", view);
  const title = t("app." + view + ".title");
  const body = `<div class="container"><h1 id="app-h1" tabindex="-1">${esc(title)}</h1>
<div id="app-root" data-view="${view}"></div>
<noscript><p class="notice">${esc(t("app.needs-js"))}</p></noscript></div>`;
  return { key: `app:${view}`, kind: "app", lang, path: url, title: `${title} | ${cx.config.name}`, description: t("app." + view + ".desc"), robots: "noindex", body, pageType: "app", nav: view === "settings" ? "settings" : "study", dataAttrs: { "data-view": view, "data-courses": Object.keys(cx.model.courses).join(" ") } };
}

export function rootChooser(model, opts, assets) {
  const langs = model.publishedLangs;
  const base = opts.basePath;
  const links = langs.map((l) => `<li><a href="${base}/${l.path}/" hreflang="${esc(l.code)}" lang="${esc(l.code)}">${esc(l.name)}</a></li>`).join("");
  const alt = [...langs.map((l) => `<link rel="alternate" hreflang="${esc(l.code)}" href="${opts.origin}${base}/${l.path}/">`), `<link rel="alternate" hreflang="x-default" href="${opts.origin}${base}/">`].join("\n");
  const ver = model.config.searchEngineVerification || {};
  const verify = [ver.google && `<meta name="google-site-verification" content="${esc(ver.google)}">`, ver.bing && `<meta name="msvalidate.01" content="${esc(ver.bing)}">`, ver.yandex && `<meta name="yandex-verification" content="${esc(ver.yandex)}">`, ver.naver && `<meta name="naver-site-verification" content="${esc(ver.naver)}">`, ver.baidu && `<meta name="baidu-site-verification" content="${esc(ver.baidu)}">`].filter(Boolean).join("\n");
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(model.config.name)} — gamified academic courses</title>
<meta name="description" content="Anemone: free, accessible, gamified university courses. Choose your language.">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${opts.origin}${base}/">
${alt}
${verify}
<meta name="theme-color" content="#0a4fbd">
<link rel="icon" href="${base}/assets/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${base}/assets/css/site.css?v=${assets.cssHash}">
</head>
<body>
<main class="container reading" style="padding-block:3rem">
<h1>${esc(model.config.name)}</h1>
<p class="lead">Gamified, accessible academic courses. First course: Mass Communication Theories.</p>
<h2>Choose a language</h2>
<ul class="lang-list" style="font-size:1.2rem">${links}</ul>
</main>
</body></html>
`;
}

export function notFoundPage(model, opts, assets) {
  const base = opts.basePath;
  const links = model.publishedLangs.map((l) => `<li><a href="${base}/${l.path}/" lang="${esc(l.code)}">${esc(l.name)}</a></li>`).join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>404 — Page not found | ${esc(model.config.name)}</title>
<meta name="robots" content="noindex">
<link rel="icon" href="${base}/assets/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${base}/assets/css/site.css?v=${assets.cssHash}">
</head><body><main class="container reading" style="padding-block:3rem" id="main">
<h1>404</h1><p class="lead">This page does not exist (or has moved). Sayfa bulunamadı.</p>
<ul class="lang-list" style="font-size:1.2rem">${links}</ul>
</main></body></html>
`;
}
