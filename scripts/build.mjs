// node scripts/build.mjs [--local [port]] [--force]
// Generates the whole static site (HTML, data bundles, sitemaps, manifests, service worker) from content/.
import path from "node:path";
import fs from "node:fs";
import { ROOT, readText, writeFile, rmDir, walkFiles, hash, esc, plainText, minCss } from "./lib/util.mjs";
import { loadModel } from "./lib/content.mjs";
import { makeCtx, layout, formatBib, mdContext } from "./lib/site.mjs";
import * as P from "./lib/pages.mjs";
import { tokensCss, contrastReport } from "./lib/theme.mjs";
import { iconPng, ICON_SVG } from "./lib/png.mjs";
import { render as renderMd } from "./lib/markdown.mjs";
import { APP_VIEWS } from "./lib/site.mjs";

const args = process.argv.slice(2);
const local = args.includes("--local");
const force = args.includes("--force");
const port = local ? args[args.indexOf("--local") + 1] && /^\d+$/.test(args[args.indexOf("--local") + 1]) ? args[args.indexOf("--local") + 1] : "8123" : null;

const model = loadModel();
const { errors, warnings } = model.report;
if (errors.length) {
  console.error(errors.map((e) => "ERROR " + e).join("\n"));
  console.error(`${errors.length} validation error(s).${force ? " Continuing because of --force." : " Build aborted (use --force to override)."}`);
  if (!force) process.exit(1);
}

const opts = {
  origin: local ? `http://localhost:${port}` : model.config.origin,
  basePath: local ? "" : model.config.basePath.replace(/\/$/, ""),
  outDir: path.join(ROOT, local ? ".preview" : model.config.outDir),
};
const OUT = opts.outDir;
rmDir(OUT);
const out = (rel, content) => writeFile(path.join(OUT, rel), content);

// contrast gate (colour tokens are generated, so they are checked on every build)
const bad = contrastReport().filter((r) => !r.ok);
if (bad.length) { console.error(bad.map((r) => `contrast FAIL ${r.theme} ${r.pair} ${r.ratio}`).join("\n")); if (!force) process.exit(1); }

// ---------------------------------------------------------------------------
// assets
// ---------------------------------------------------------------------------
const srcAssets = path.join(ROOT, "src", "assets");
// small, safe CSS minification: strip comments and collapse whitespace (no selector or value rewriting)
const cssText = minCss(tokensCss() + readText(path.join(srcAssets, "css", "site.css")) + readText(path.join(srcAssets, "css", "skin.css")));
const cssHash = hash(cssText);
out("assets/css/site.css", cssText);
const jsFiles = walkFiles(path.join(srcAssets, "js"));
let jsAll = "";
for (const f of jsFiles) { const txt = readText(path.join(srcAssets, "js", f)); jsAll += txt; out("assets/js/" + f, txt); }
// the moderation filter is shared with the worker: inline the word lists so the browser needs no JSON import
{
  const wl = JSON.parse(readText(path.join(ROOT, "worker", "src", "wordlists.json")));
  const modSrc = readText(path.join(ROOT, "worker", "src", "moderation.js")).replace(/import WORDLISTS from [^\n]*\n/, () => "const WORDLISTS = " + JSON.stringify({ lists: wl.lists }) + ";\n");
  jsAll += modSrc;
  out("assets/js/moderation.js", modSrc);
}
const jsHash = hash(jsAll);
out("assets/icon.svg", ICON_SVG);
out("assets/icon-192.png", iconPng(192));
out("assets/icon-512.png", iconPng(512));
out(".nojekyll", "");
const assets = { cssHash, jsHash };

// ---------------------------------------------------------------------------
// pages
// ---------------------------------------------------------------------------
const site = { pages: [], byKey: new Map() };
const ctxs = {};
const missingUi = new Set();
let siteUpdated = "2026-01-01";
for (const course of Object.values(model.courses)) for (const l of course.lessons) {
  for (const lang of model.publishedLangs) {
    const u = model.i18n[lang.code]?.courses?.[course.id]?.lessons?.[l.id]?.updated;
    if (u && u > siteUpdated) siteUpdated = u;
  }
}

for (const lang of model.publishedLangs) {
  const cx = makeCtx(model, lang, opts);
  ctxs[lang.code] = cx;
  const L = model.i18n[lang.code];
  const list = [];
  list.push(P.homePage(cx));
  for (const course of Object.values(model.courses)) {
    list.push(P.coursePage(cx, course));
    for (const l of course.lessons) list.push(l.status === "ready" ? P.lessonPage(cx, course, l) : P.lessonStubPage(cx, course, l));
  }
  list.push(P.peopleIndexPage(cx));
  for (const id of Object.keys(model.people)) if (L.people[id]) list.push(P.personPage(cx, id));
  list.push(P.glossaryIndexPage(cx));
  for (const id of Object.keys(model.concepts)) if (L.concepts[id]) list.push(P.conceptPage(cx, id));
  list.push(P.timelinePage(cx));
  for (const id of ["about", "privacy", "contact"]) list.push(P.staticPage(cx, id));
  for (const v of APP_VIEWS) list.push(P.appPage(cx, v));
  for (const p of list) {
    p.lastUpdated = p.lastUpdated || (p.robots === "index" ? siteUpdated : null);
    site.pages.push(p);
    if (!site.byKey.has(p.key)) site.byKey.set(p.key, []);
    site.byKey.get(p.key).push(p);
    if (p.missing?.length) errors.push(`page ${p.path}: unresolved references ${p.missing.join(", ")}`);
  }
}

// hreflang alternates, language switcher
const originOf = (p) => opts.origin + p.path;
for (const p of site.pages) {
  const same = (site.byKey.get(p.key) || []).filter((q) => q.robots === "index");
  if (p.robots === "index" && same.length > 0) {
    p.alternates = same.map((q) => ({ hreflang: q.lang.code, href: originOf(q) }));
    const def = same.find((q) => q.lang.code === model.config.defaultLang) || same.find((q) => q.lang.code === model.config.sourceLang) || same[0];
    // the language chooser at the site root is the x-default of every language home page
    p.alternates.push({ hreflang: "x-default", href: p.key === "home" ? opts.origin + opts.basePath + "/" : originOf(def) });
  } else p.alternates = [];
  p.langLinks = model.publishedLangs.map((l) => {
    const target = (site.byKey.get(p.key) || []).find((q) => q.lang.code === l.code && q.robots === "index") || (site.byKey.get(p.key) || []).find((q) => q.lang.code === l.code);
    const href = target ? target.path : `${opts.basePath}/${l.path}/`;
    return { code: l.code, name: l.name, href, current: l.code === p.lang.code };
  });
}

// write html
const ver0 = hash(cssHash + jsHash + siteUpdated + site.pages.length);
assets.version = ver0;
for (const p of site.pages) {
  const cx = ctxs[p.lang.code];
  const html = layout(cx, p, assets);
  const rel = p.path.slice(opts.basePath.length).replace(/^\//, "") + "index.html";
  out(rel, html);
}
out("index.html", P.rootChooser(model, opts, assets));
out("404.html", P.notFoundPage(model, opts, assets));
for (const cx of Object.values(ctxs)) for (const k of cx.missing) missingUi.add(`${cx.lang.code}:${k}`);

// ---------------------------------------------------------------------------
// data bundles for the JavaScript layer
// ---------------------------------------------------------------------------
const dataUrl = (lang) => `${opts.basePath}/data/${lang.path}`;
for (const lang of model.publishedLangs) {
  const cx = ctxs[lang.code];
  const L = model.i18n[lang.code];
  out(`data/${lang.path}/ui.json`, JSON.stringify(cx.ui));
  for (const course of Object.values(model.courses)) {
    const info = L.courses[course.id].info;
    const bundle = {
      id: course.id, title: info.title, url: P.courseUrl(cx, course), lang: lang.code,
      units: course.units.map((u, ui) => ({
        id: u.id, color: u.color, index: ui, title: info.units[u.id].title,
        lessons: u.lessons.map((l) => {
          const rec = course.lessonById[l.id];
          return { id: l.id, title: info.lessons[l.id].title, url: P.lessonUrl(cx, course, l.id), minutes: l.minutes, prereq: l.prereq || [], status: l.status, index: rec.index, unit: u.id };
        }),
      })),
    };
    out(`data/${lang.path}/course-${course.id}.json`, JSON.stringify(bundle));
    for (const l of course.lessons) {
      if (l.status !== "ready") continue;
      const text = L.courses[course.id].lessons[l.id];
      out(`data/${lang.path}/${course.id}/q/${l.id}.json`, JSON.stringify(P.buildLessonPayload(cx, course, l, text)));
    }
  }
  out(`data/${lang.path}/tips.json`, JSON.stringify({
    concepts: Object.keys(model.concepts).filter((id) => L.concepts[id]).map((id) => ({ id, name: L.concepts[id].term, short: plainText(L.concepts[id].short), url: cx.url(cx.seg("url.glossary"), L.concepts[id].slug) })),
    lessons: Object.values(model.courses).flatMap((c) => c.lessons.filter((l) => l.status === "ready").map((l) => ({ course: c.id, id: l.id }))),
  }));
  const mdc = (extra) => mdContext(cx, extra || {});
  for (const id of Object.keys(model.people)) {
    const pt = L.people[id]; if (!pt) continue;
    const pf = model.people[id];
    const uses = [];
    for (const course of Object.values(model.courses)) for (const l of course.lessons) if (l.status === "ready" && course.meta[l.id].people?.includes(id)) uses.push({ title: L.courses[course.id].info.lessons[l.id].title, url: P.lessonUrl(cx, course, l.id) });
    out(`data/${lang.path}/people/${id}.json`, JSON.stringify({
      id, kind: "person", name: pt.name, short: pt.short, url: cx.url(cx.seg("url.people"), pt.slug),
      lifespan: pf.born?.year ? (pf.died?.year ? cx.t("person.lifespan-range", { born: pf.born.year, died: pf.died.year }) : cx.t("person.lifespan-born", { born: pf.born.year })) : "",
      roles: pt.roles || [], html: renderMd(pt.bio, mdc()), inCourse: pt.inCourse ? renderMd(pt.inCourse, mdc()) : "",
      works: (pt.works || []).map((w) => formatBib(model.bib[w.bib])), lessons: uses,
    }));
  }
  for (const id of Object.keys(model.concepts)) {
    const ct = L.concepts[id]; if (!ct) continue;
    const uses = [];
    for (const course of Object.values(model.courses)) for (const l of course.lessons) if (l.status === "ready" && course.meta[l.id].concepts?.includes(id)) uses.push({ title: L.courses[course.id].info.lessons[l.id].title, url: P.lessonUrl(cx, course, l.id) });
    out(`data/${lang.path}/concepts/${id}.json`, JSON.stringify({
      id, kind: "concept", name: ct.term, short: ct.short, url: cx.url(cx.seg("url.glossary"), ct.slug),
      html: renderMd(ct.body, mdc()), example: ct.example ? renderMd(ct.example, mdc()) : "", lessons: uses,
    }));
  }
}

// ---------------------------------------------------------------------------
// sitemaps, robots, manifests, service worker
// ---------------------------------------------------------------------------
const indexable = site.pages.filter((p) => p.robots === "index");
const xml = (s) => esc(s);
const sitemapFiles = [];
for (const lang of model.publishedLangs) {
  const rows = indexable.filter((p) => p.lang.code === lang.code).sort((a, b) => a.path.localeCompare(b.path));
  const body = rows.map((p) => `<url><loc>${xml(originOf(p))}</loc><lastmod>${p.lastUpdated || siteUpdated}</lastmod>${p.alternates.map((a) => `<xhtml:link rel="alternate" hreflang="${xml(a.hreflang)}" href="${xml(a.href)}"/>`).join("")}</url>`).join("\n");
  out(`sitemap-${lang.path}.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`);
  sitemapFiles.push(`sitemap-${lang.path}.xml`);
}
out("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapFiles.map((f) => `<sitemap><loc>${xml(opts.origin + opts.basePath + "/" + f)}</loc><lastmod>${siteUpdated}</lastmod></sitemap>`).join("\n")}\n</sitemapindex>\n`);
out("robots.txt", `User-agent: *\nAllow: /\nDisallow: ${opts.basePath}/*/app/\n\nSitemap: ${opts.origin}${opts.basePath}/sitemap.xml\n`);

for (const lang of model.publishedLangs) {
  const cx = ctxs[lang.code];
  out(`manifest-${lang.path}.webmanifest`, JSON.stringify({
    name: cx.t("pwa.name", { name: model.config.name }), short_name: model.config.name, description: cx.t("home.lead"),
    lang: lang.code, dir: lang.dir, start_url: `${opts.basePath}/${lang.path}/app/study/`, scope: `${opts.basePath}/`, display: "standalone",
    background_color: "#fbfaf7", theme_color: "#0a4fbd",
    icons: [
      { src: `${opts.basePath}/assets/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: `${opts.basePath}/assets/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any maskable" },
      { src: `${opts.basePath}/assets/icon.svg`, sizes: "any", type: "image/svg+xml" },
    ],
  }, null, 1));
}

const allOut = walkFiles(OUT);
const contentHash = hash(allOut.filter((f) => !f.endsWith("sw.js")).map((f) => f + fs.statSync(path.join(OUT, f)).size).join("|") + cssHash + jsHash);
const precache = [`${opts.basePath}/assets/css/site.css?v=${cssHash}`, ...jsFiles.map((f) => `${opts.basePath}/assets/js/${f}${f === "app.js" ? `?v=${jsHash}` : ""}`), `${opts.basePath}/assets/icon.svg`];
out("sw.js", readText(path.join(srcAssets, "sw.template.js")).replace("__VERSION__", contentHash).replace("__BASE__", opts.basePath).replace("__PRECACHE__", JSON.stringify(precache)));
out("data/version.json", JSON.stringify({ v: contentHash }));

// ---------------------------------------------------------------------------
console.log(`built ${site.pages.length} pages (${indexable.length} indexable) for ${model.publishedLangs.length} language(s) -> ${path.relative(ROOT, OUT)}`);
console.log(`site version ${contentHash}; content last updated ${siteUpdated}`);
if (missingUi.size) console.log(`UI keys missing (shown as raw keys): ${[...missingUi].slice(0, 40).join(", ")}${missingUi.size > 40 ? " …" : ""} (${missingUi.size})`);
if (warnings.length) console.log(`${warnings.length} warning(s); run node scripts/validate.mjs to see them`);
if (errors.length && !force) process.exit(1);
