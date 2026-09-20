// node scripts/check-site.mjs [dir]   post-build checks on the generated site (SEO, hreflang, sitemap, links, structure)
import fs from "node:fs";
import path from "node:path";
import { ROOT, walkFiles, readJson } from "./lib/util.mjs";

const config = readJson(path.join(ROOT, "site.config.json"));
const local = process.argv.includes("--local");
const dir = path.resolve(ROOT, process.argv.find((a, i) => i > 1 && !a.startsWith("--")) || (local ? ".preview" : config.outDir));
const base = local ? "" : config.basePath.replace(/\/$/, "");
let origin = null;

const errors = [], warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const files = walkFiles(dir);
const htmlFiles = files.filter((f) => f.endsWith(".html"));
const exists = new Set(files);
const urlOf = (f) => `${base}/${f.replace(/index\.html$/, "")}`.replace(/\/\/+/g, "/");
const fileOfUrl = (u) => { // url (with base) -> file rel path or null
  let p = u.split("#")[0].split("?")[0];
  if (!p.startsWith(base + "/") && p !== base) return null;
  p = p.slice(base.length).replace(/^\//, "");
  if (p === "" || p.endsWith("/")) p += "index.html";
  return p;
};

const rootHtml = fs.readFileSync(path.join(dir, "index.html"), "utf8");
origin = /<link rel="canonical" href="([^"]*)"/.exec(rootHtml)[1].replace(/\/$/, "").slice(0, base.length ? -base.length : undefined);
if (!local && origin !== config.origin) err(`root canonical origin ${origin} differs from site.config origin ${config.origin}`);
const pages = {};
for (const f of htmlFiles) {
  const html = fs.readFileSync(path.join(dir, f), "utf8");
  const g = (re) => (re.exec(html) || [])[1];
  const robots = g(/<meta name="robots" content="([^"]*)"/) || "";
  const page = {
    file: f, html, url: urlOf(f), robots,
    indexable: !/noindex/i.test(robots),
    title: g(/<title>([\s\S]*?)<\/title>/),
    desc: g(/<meta name="description" content="([^"]*)"/),
    canonical: g(/<link rel="canonical" href="([^"]*)"/),
    lang: g(/<html lang="([^"]*)"/),
    dir: g(/<html lang="[^"]*" dir="([^"]*)"/),
    alternates: [...html.matchAll(/<link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g)].map((m) => ({ hreflang: m[1], href: m[2] })),
    h1: [...html.matchAll(/<h1[\s>]/g)].length,
    links: [...html.matchAll(/<a [^>]*href="([^"#][^"]*)"/g)].map((m) => m[1]),
  };
  pages[f] = page;
}

const titles = new Map(), descs = new Map();
for (const p of Object.values(pages)) {
  const w = p.file;
  if (!p.title) err(`${w}: no <title>`);
  if (!p.lang) err(`${w}: no html lang`);
  if (!p.canonical && w !== "404.html") err(`${w}: no canonical`);
  if (w === "404.html") continue;
  if (p.h1 !== 1 && w !== "index.html") err(`${w}: expected exactly one <h1>, found ${p.h1}`);
  if (p.indexable) {
    if (!p.desc || p.desc.length < 40) err(`${w}: missing or very short meta description`);
    if (p.desc && p.desc.length > 200) warn(`${w}: meta description longer than 200 characters`);
    if (titles.has(p.title)) err(`${w}: duplicate title with ${titles.get(p.title)}`); else titles.set(p.title, w);
    if (p.desc) { if (descs.has(p.desc)) err(`${w}: duplicate meta description with ${descs.get(p.desc)}`); else descs.set(p.desc, w); }
    if (p.canonical && origin && p.canonical !== origin + p.url) err(`${w}: canonical ${p.canonical} is not self-referencing (${origin + p.url})`);
    if (p.title && p.title.length > 75) warn(`${w}: title longer than 75 characters`);
  }
  if (p.lang && !/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/.test(p.lang)) err(`${w}: odd lang ${p.lang}`);
  // structure
  if (!/<a class="skip-link" href="#main"/.test(p.html) && w !== "index.html") err(`${w}: no skip link`);
  const heads = [...p.html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  for (let i = 1; i < heads.length; i++) if (heads[i] - heads[i - 1] > 1) { warn(`${w}: heading level jumps h${heads[i - 1]} -> h${heads[i]}`); break; }
  const ids = [...p.html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.find((x, i) => ids.indexOf(x) !== i);
  if (dup) err(`${w}: duplicate id "${dup}"`);
  for (const m of p.html.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/g)) err(`${w}: <img> without alt`);
  for (const m of p.html.matchAll(/aria-labelledby="([^"]+)"/g)) if (!ids.includes(m[1])) err(`${w}: aria-labelledby points at missing id ${m[1]}`);
  for (const m of p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { const j = JSON.parse(m[1]); if (!j["@context"] || !j["@type"]) err(`${w}: JSON-LD without @context/@type`); }
    catch (e) { err(`${w}: invalid JSON-LD (${e.message})`); }
  }
  if (/\[\[(?:person|concept|lesson|cite):/.test(p.html.replace(/<script[\s\S]*?<\/script>/g, ""))) err(`${w}: unresolved [[reference]] left in the page text`);
  if (/data-page="lesson"/.test(p.html) && !/class="ref ref-/.test(p.html)) err(`${w}: lesson page has no in-text references (renderer regression?)`);
  if (p.indexable && p.alternates.length && !p.alternates.some((a) => a.hreflang === "x-default")) err(`${w}: hreflang set without x-default`);
  // internal links
  for (const href of p.links) {
    if (/^(https?:|mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    let target = href;
    if (!target.startsWith("/")) { target = path.posix.join(path.posix.dirname(p.url + "x"), target); }
    const f = fileOfUrl(target);
    if (!f) { err(`${w}: link outside the site base: ${href}`); continue; }
    if (!exists.has(f)) err(`${w}: broken internal link ${href}`);
  }
}

// hreflang reciprocity
const byUrl = Object.fromEntries(Object.values(pages).map((p) => [origin ? origin + p.url : p.url, p]));
for (const p of Object.values(pages)) {
  if (!p.indexable || p.file === "index.html") continue;
  const self = origin ? origin + p.url : p.url;
  if (p.alternates.length && !p.alternates.some((a) => a.href === self && a.hreflang === p.lang)) err(`${p.file}: hreflang set does not include the page itself`);
  for (const a of p.alternates) {
    if (a.hreflang === "x-default" && byUrl[a.href] === undefined) continue;
    if (a.hreflang === "x-default") continue;
    const q = byUrl[a.href];
    if (a.hreflang === "x-default" && a.href === origin + base + "/") continue;
    if (!q) { err(`${p.file}: hreflang ${a.hreflang} points to a missing page ${a.href}`); continue; }
    if (!q.indexable) err(`${p.file}: hreflang ${a.hreflang} points to a noindex page`);
    if (q.lang !== a.hreflang) err(`${p.file}: hreflang ${a.hreflang} points to a page whose lang is ${q.lang}`);
    if (!q.alternates.some((b) => b.href === self)) err(`${p.file}: hreflang not reciprocal: ${a.href} does not link back`);
  }
}

// sitemaps <-> indexable pages
const sitemapUrls = new Set();
for (const f of files.filter((x) => /^sitemap-.*\.xml$/.test(x))) {
  const xml = fs.readFileSync(path.join(dir, f), "utf8");
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const u = m[1].replace(/&amp;/g, "&");
    if (sitemapUrls.has(u)) err(`${f}: duplicate url ${u}`);
    sitemapUrls.add(u);
    if (!byUrl[u]) err(`${f}: sitemap lists a URL with no page: ${u}`);
    else if (!byUrl[u].indexable) err(`${f}: sitemap lists a noindex page: ${u}`);
  }
}
for (const p of Object.values(pages)) {
  if (p.file === "index.html" || p.file === "404.html") continue;
  const u = origin ? origin + p.url : p.url;
  if (p.indexable && !sitemapUrls.has(u)) err(`${p.file}: indexable page missing from the sitemap`);
}
if (!files.includes("sitemap.xml")) err("sitemap.xml missing");
if (!files.includes("robots.txt")) err("robots.txt missing");

console.log(`${htmlFiles.length} pages checked (${Object.values(pages).filter((p) => p.indexable).length} indexable), ${sitemapUrls.size} sitemap URLs`);
for (const w of warnings.slice(0, 40)) console.log("  warn  " + w);
for (const e of errors.slice(0, 80)) console.log("  ERROR " + e);
if (errors.length > 80) console.log(`  … and ${errors.length - 80} more errors`);
console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
