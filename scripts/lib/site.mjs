// Site context (per language), layout, head/SEO helpers and citation formatting.
import { esc, jsonForScript, plainText } from "./util.mjs";
import { render as renderMd } from "./markdown.mjs";

export const APP_VIEWS = ["study", "stats", "review", "exam", "settings", "account", "leaderboard", "profile"];

export function format(str, params) {
  return String(str).replace(/\{(\w+)\}/g, (m, k) => (params && k in params ? params[k] : m));
}

export function makeCtx(model, lang, opts) {
  const { config, i18n } = model;
  const base = opts.basePath;
  const origin = opts.origin;
  const enUi = i18n.en?.ui || {};
  const ui = { ...enUi, ...(i18n[lang.code]?.ui || {}) };
  const missing = new Set();
  const t = (key, params) => {
    if (!(key in ui)) { missing.add(key); return key; }
    return format(ui[key], params);
  };
  const seg = (key) => t(key);
  const url = (...segs) => `${base}/${lang.path}/${segs.filter(Boolean).join("/")}${segs.filter(Boolean).length ? "/" : ""}`;
  const abs = (u) => origin + u;
  const num = new Intl.NumberFormat(lang.code);
  const dateFmt = (iso) => {
    try { return new Intl.DateTimeFormat(lang.code, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z")); }
    catch { return iso; }
  };
  const collator = new Intl.Collator(lang.code);
  return { model, lang, base, origin, ui, t, seg, url, abs, num, dateFmt, collator, missing, config };
}

/** Build the markdown context for a body (references resolve to URLs in this language). */
export function mdContext(cx, opts = {}) {
  const { model, lang, url } = cx;
  const L = model.i18n[lang.code];
  const courseId = opts.courseId;
  const citeMap = opts.citeMap; // Map bibId -> number (built as we go)
  const missing = opts.missing || [];
  return {
    noCite: !!opts.noCite,
    ref(kind, id, label) {
      if (kind === "person") {
        const t = L.people?.[id];
        if (!t) return null;
        return { href: url(cx.seg("url.people"), t.slug), label: label || t.name, title: t.short };
      }
      if (kind === "concept") {
        const t = L.concepts?.[id];
        if (!t) return null;
        return { href: url(cx.seg("url.glossary"), t.slug), label: label || t.term, title: t.short };
      }
      if (kind === "lesson") {
        for (const c of Object.values(model.courses)) {
          const l = c.lessonById[id];
          if (l) {
            const info = L.courses?.[c.id]?.info;
            return { href: url(info.slug, info.lessons[id].slug), label: label || info.lessons[id].title };
          }
        }
        return null;
      }
      return null;
    },
    cite(id) {
      if (!citeMap) return null;
      if (!model.bib[id]) return null;
      if (!citeMap.has(id)) citeMap.set(id, citeMap.size + 1);
      return citeMap.get(id);
    },
    citeLabel: (n) => cx.t("lesson.source-n", { n }),
    onMissing: (kind, id) => missing.push(`${kind}:${id}`),
  };
}

export const md = (cx, text, opts) => renderMd(text, mdContext(cx, opts));

// ---------------------------------------------------------------------------
// bibliography formatting
// ---------------------------------------------------------------------------
const THEME_ORDER = ["console", "terminal", "amber", "ice", "light", "sepia", "cvd", "contrast", "paper"];

export function formatBib(b, { html = true } = {}) {
  const I = (s) => (html ? `<i>${esc(s)}</i>` : s);
  const E = (s) => (html ? esc(s) : s);
  const authors = (b.authors || []).join("; ") || b.institution || "";
  const year = b.originalYear && b.originalYear !== b.year ? `${b.year} [${b.originalYear}]` : b.year ? String(b.year) : "n.d.";
  let s = "";
  const head = authors ? `${E(authors)} (${E(year)}). ` : `(${E(year)}). `;
  if (b.type === "article") {
    s = `${head}${E(b.title)}. ${I(b.container)}${b.volume ? `, ${E(b.volume)}` : ""}${b.issue ? `(${E(b.issue)})` : ""}${b.pages ? `, ${E(b.pages)}` : ""}.`;
  } else if (b.type === "chapter") {
    s = `${head}${E(b.title)}. In ${b.editors?.length ? E(b.editors.join("; ")) + " (Eds.), " : ""}${I(b.bookTitle || "")}${b.pages ? ` (pp. ${E(b.pages)})` : ""}. ${E(b.publisher || "")}.`;
  } else if (b.type === "book" || b.type === "thesis" || b.type === "report") {
    s = `${head}${I(b.title)}${b.edition ? ` (${E(b.edition)})` : ""}. ${E([b.place, b.publisher].filter(Boolean).join(": "))}.`;
  } else {
    s = `${authors ? E(authors) + ". " : ""}${E(b.title)}${b.publisher ? `. ${E(b.publisher)}` : ""}${b.year ? ` (${E(b.year)})` : ""}.`;
  }
  if (b.doi) s += html ? ` <a href="https://doi.org/${esc(b.doi)}" rel="noopener noreferrer">https://doi.org/${esc(b.doi)}</a>` : ` https://doi.org/${b.doi}`;
  else if (b.url) s += html ? ` <a href="${esc(b.url)}" rel="noopener noreferrer">${esc(b.url)}</a>` : ` ${b.url}`;
  return s.replace(/\s+/g, " ").replace(/\.\./g, ".");
}

// ---------------------------------------------------------------------------
// head + layout
// ---------------------------------------------------------------------------
const EARLY = `<script>try{var d=document.documentElement,s=JSON.parse(localStorage.getItem('anemone.settings')||'{}');if(s.theme&&s.theme!=='auto'&&s.theme!=='dark')d.setAttribute('data-theme',s.theme);if(s.fs)d.style.setProperty('--fs',s.fs);if(s.lh)d.style.setProperty('--lh',s.lh);if(s.dyslexia)d.setAttribute('data-dyslexia','1');if(s.motion==='reduce')d.setAttribute('data-motion','reduce')}catch(e){}</script>`;

export function ldScripts(list) {
  return (list || []).filter(Boolean).map((o) => `<script type="application/ld+json">${jsonForScript(o)}</script>`).join("\n");
}

export function breadcrumbLd(cx, items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: plainText(it.name), item: cx.abs(it.url) })),
  };
}

const BRAND_MARK = `<svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><g fill="currentColor"><ellipse cx="32" cy="15" rx="7" ry="13"/><ellipse cx="32" cy="15" rx="7" ry="13" transform="rotate(60 32 32)"/><ellipse cx="32" cy="15" rx="7" ry="13" transform="rotate(120 32 32)"/><ellipse cx="32" cy="15" rx="7" ry="13" transform="rotate(180 32 32)"/><ellipse cx="32" cy="15" rx="7" ry="13" transform="rotate(240 32 32)"/><ellipse cx="32" cy="15" rx="7" ry="13" transform="rotate(300 32 32)"/></g></svg>`;
const BRAND_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><g fill="currentColor"><ellipse cx="32" cy="15" rx="7" ry="13"/><ellipse cx="32" cy="15" rx="7" ry="13" transform="rotate(60 32 32)"/><ellipse cx="32" cy="15" rx="7" ry="13" transform="rotate(120 32 32)"/><ellipse cx="32" cy="15" rx="7" ry="13" transform="rotate(180 32 32)"/><ellipse cx="32" cy="15" rx="7" ry="13" transform="rotate(240 32 32)"/><ellipse cx="32" cy="15" rx="7" ry="13" transform="rotate(300 32 32)"/></g><circle cx="32" cy="32" r="6" fill="var(--bg)"/></svg>`;

/**
 * page = { key, title, description, path (url with base), robots ('index'|'noindex'), body, bodyAttrs, ld[], og{type},
 *          alternates: [{hreflang, href}], xDefault, dataAttrs, nav (current nav id), lastUpdated }
 */
export function layout(cx, page, assets) {
  const { lang, t, base, abs, config, model } = cx;
  const title = page.title;
  const canonical = abs(page.path);
  const robots = page.robots === "noindex" ? "noindex,follow" : "index,follow,max-image-preview:large";
  const alt = (page.alternates || []).map((a) => `<link rel="alternate" hreflang="${esc(a.hreflang)}" href="${esc(a.href)}">`).join("\n");
  const locAlt = (page.alternates || []).filter((a) => a.hreflang !== "x-default" && a.hreflang !== lang.code).map((a) => `<meta property="og:locale:alternate" content="${esc(a.hreflang.replace("-", "_"))}">`).join("\n");
  const ver = config.searchEngineVerification || {};
  const verify = [
    ver.google && `<meta name="google-site-verification" content="${esc(ver.google)}">`,
    ver.bing && `<meta name="msvalidate.01" content="${esc(ver.bing)}">`,
    ver.yandex && `<meta name="yandex-verification" content="${esc(ver.yandex)}">`,
    ver.naver && `<meta name="naver-site-verification" content="${esc(ver.naver)}">`,
    ver.baidu && `<meta name="baidu-site-verification" content="${esc(ver.baidu)}">`,
  ].filter(Boolean).join("\n");
  // wiki-style navigation: a prompt-like path bar (each segment is a link) instead of a menu
  const bl = (page.ld || []).find((o) => o && o["@type"] === "BreadcrumbList");
  let trail = bl ? bl.itemListElement.map((it) => ({ name: it.name, href: String(it.item).replace(cx.origin, "") })) : [];
  if (trail.length && trail[0].name === t("bc.home")) trail = trail.slice(1);
  if (!bl && page.pageType !== "home") trail = [{ name: String(page.title).split(" | ")[0], href: page.path }];
  const promptItems = trail.length
    ? trail.map((it, i) => `<li><span class="sep" aria-hidden="true">/</span>${i < trail.length - 1 ? `<a href="${esc(it.href)}">${esc(it.name)}</a>` : `<span aria-current="page">${esc(it.name)}</span>`}</li>`).join("")
    : "";
  const brand = trail.length ? `<a class="user" href="${esc(cx.url())}">${esc(config.name.toLowerCase())}</a>` : `<span class="user" aria-current="page">${esc(config.name.toLowerCase())}</span>`;
  const langOpts = (page.langLinks || []).map((l) => `<option value="${esc(l.href)}" lang="${esc(l.code)}"${l.current ? " selected" : ""}>${esc(l.name)}</option>`).join("");
  const themeOpts = THEME_ORDER.map((n) => `<option value="${n}"${n === "console" ? " selected" : ""}>${esc(t("theme." + n))}</option>`).join("");
  const others = `<label class="sel js-only"><span>${esc(t("tools.language"))}</span><select id="lang-select" data-lang-select>${langOpts}</select></label>`;
  const langLinks = (page.langLinks || []).map((l) => `<li><a href="${esc(l.href)}" hreflang="${esc(l.code)}" lang="${esc(l.code)}"${l.current ? ' aria-current="true"' : ""}>${esc(l.name)}</a></li>`).join("");
  const bodyAttrs = Object.entries({ "data-page": page.pageType || "", "data-lang": lang.code, "data-base": base, "data-lang-path": lang.path, "data-build": assets.version, "data-api": config.apiBase || "", ...(page.dataAttrs || {}) })
    .map(([k, v]) => `${k}="${esc(v)}"`).join(" ");
  const credit = t("footer.credit", { name: config.author.name });
  const updated = page.lastUpdated ? `<p class="muted small">${esc(t("footer.updated", { date: cx.dateFmt(page.lastUpdated) }))}</p>` : "";
  const trans = page.translationStatus && page.translationStatus !== "source" && page.translationStatus !== "reviewed"
    ? `<p class="notice small" role="note">${esc(t("translation.machine"))} <a href="${esc(config.translationFixUrl)}" rel="noopener noreferrer">${esc(t("translation.fix"))}</a></p>` : "";

  return `<!doctype html>
<html lang="${esc(lang.code)}" dir="${lang.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(page.description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${esc(canonical)}">
${alt}
<meta property="og:site_name" content="${esc(config.name)}">
<meta property="og:type" content="${esc(page.ogType || "website")}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:locale" content="${esc(lang.code.replace("-", "_"))}">
${locAlt}
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="theme-color" content="#0a4fbd">
${verify}
<link rel="manifest" href="${base}/manifest-${lang.path}.webmanifest">
<link rel="icon" href="${base}/assets/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${base}/assets/icon-192.png">
<link rel="stylesheet" href="${base}/assets/css/site.css?v=${assets.cssHash}">
${EARLY}
${ldScripts(page.ld)}
</head>
<body ${bodyAttrs}>
<a class="skip-link" href="#main">${esc(t("skip"))}</a>
<header class="topbar"><div class="container">
<nav class="prompt" aria-label="${esc(t("nav.breadcrumb"))}"><ol><li>${BRAND_MARK}${brand}</li>${promptItems}<li><span class="dollar" aria-hidden="true">$</span></li></ol></nav>
<div class="tools">${others}<label class="sel js-only"><span>${esc(t("tools.theme"))}</span><select id="theme-select">${themeOpts}</select></label><a class="btn" href="${esc(cx.url("app", "settings"))}">${esc(t("nav.settings"))}</a><a class="btn" href="${esc(cx.url("app", "account"))}">${esc(t("nav.account"))}</a></div>
</div></header>
<main id="main" tabindex="-1">
${page.body}
</main>
<footer class="status"><div class="container">
<p class="hud" id="hud"><a href="${esc(cx.url("app", "study"))}">${esc(t("nav.study"))}</a><span class="small" id="sync-state" role="status"></span></p>
${trans}
<p class="small">${esc(credit)} <a href="${esc(cx.url(cx.seg("url.about")))}">${esc(t("footer.how"))}</a></p>
${updated}
<ul class="foot-links">
<li><a href="${esc(cx.url(cx.seg("url.privacy")))}">${esc(t("nav.privacy"))}</a></li>
<li><a href="${esc(cx.url(cx.seg("url.contact")))}">${esc(t("nav.contact"))}</a></li>
<li><a href="${esc(config.contentIssueUrl)}" rel="noopener noreferrer">${esc(t("footer.report"))}</a></li>
<li><a href="${esc(config.repo)}" rel="noopener noreferrer">${esc(t("footer.source"))}</a></li>
</ul>
<nav aria-label="${esc(t("footer.languages"))}"><ul class="lang-list">${langLinks}</ul></nav>
</div></footer>
<div class="toasts" id="anemone-toasts" aria-hidden="true"></div>
<div id="anemone-live" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
<div id="anemone-alert" class="sr-only" role="alert" aria-live="assertive" aria-atomic="true"></div>
<noscript><style>.js-only{display:none!important}</style></noscript>
<script type="module" src="${base}/assets/js/app.js?v=${assets.jsHash}"></script>
</body>
</html>
`;
}
