# Anemone

**A gamified, multilingual, accessible and SEO-friendly static course system.** First course: *Mass Communication Theories* (Turkish source, English translation). Lessons are short cards with questions, exams, spaced review and progress that stays on the learner's own device.

- Live site: <https://alplix.github.io/anemone/>
- Coded and written by **Alperen Yavuz**, with AI assistance (see [How the content is made](#how-the-content-is-made)).
- Code: MIT. Course content: CC BY-SA 4.0. See [Licence](#licence).

> Anemone (Greek *anemos*, "wind"): messages spread like the wind.

**The whole thing is static files.** There is no server to run and no `npm install`: a zero-dependency Node script (`scripts/build.mjs`) turns the content in `content/` into full-text HTML pages that GitHub Pages serves as they are. The game layer (cards, questions, XP, review, exams, statistics) is vanilla JavaScript added on top, so every lesson, person and concept page is readable with JavaScript switched off. Accounts and leaderboards are a separate, optional add-on; the app never depends on them.

## Features

- **Learning**: lessons of ~12 core cards (60–120 s each) with a mini question after every card, optional *deep dive* cards for the finest detail, a lesson test, per-unit "boss" exams, mixed mock exams (timed or untimed), a mistakes notebook, Leitner spaced review (5 boxes), daily goal and streak, XP, levels and ranks, badges, glossary and timeline, person and concept panels.
- **Question types**: multiple choice, true/false, matching (theory ↔ author), chronological ordering, fill in the blanks, short case analysis. No drag and drop: ordering and matching work with buttons and native selects, so they are usable by keyboard and screen reader.
- **Progress that is never lost**: every card, answer, badge and setting is saved to `localStorage` the moment it changes; "continue where you left off" resumes at the exact card; save file export/import (`.json`, sanitised on import).
- **Statistics**: per-question, per-lesson, per-unit and per-course accuracy; weak topics; *real* study time (idle time and background tabs are not counted) kept apart from time in the app; daily/weekly/total hours; best study hours. Every chart has a table and a plain-text summary.
- **Themes**: light, dark, sepia (low brightness), high contrast, colour-blind friendly, and a black-and-white **paper / e-ink** mode (no animation, thick borders, nothing depends on colour, page-turning reading). Text size, line spacing, dyslexia-friendly type, reduced motion.
- **No sound.** Nothing plays, ever.
- **Offline**: a service worker caches pages, and Settings can download a whole language for offline use (PWA manifest per language).
- **Multilingual by construction**: interface and content are separate, per-language, with a term glossary, structure-parity checks, per-language quality gates, RTL support and per-script font stacks.

## Quick start

Requires Node 20+. Nothing to install.

```bash
node scripts/validate.mjs      # validate all content
node scripts/build.mjs         # generate the site into docs/
node scripts/check-site.mjs    # SEO / hreflang / sitemap / link / structure checks on docs/
node scripts/check-contrast.mjs  # WCAG contrast of every theme colour pair
node scripts/build.mjs --local 8124 && node scripts/serve.mjs .preview 8124   # preview at http://localhost:8124/
```

`--local` builds into `.preview/` with an empty base path so the site works from `http://localhost`. The committed output in `docs/` is built with the real base path (`/anemone`) from `site.config.json`.

## Repository layout

```
site.config.json             origin, basePath, author, verification tags: the ONE place canonical URLs come from
content/                     everything the site says (see guide/data-format.md)
  languages.json             the 53 locales, their status, direction, script, slug policy
  courses/<course>/          language-independent course structure, prerequisites, lesson meta
  i18n/<lang>/               interface strings, static pages, lesson text, people, concepts (per language)
  people/ concepts/          language-independent facts (years, sources, links)
  bibliography/              verified sources (a lesson may only cite entries marked verified)
  terminology/               fixed term glossary for translators
scripts/                     build.mjs, validate.mjs, check-site.mjs, check-contrast.mjs, ui-keys.mjs, serve.mjs
  lib/                       content loader + checks, markdown-lite, page renderers, theme generator, PNG icons
src/assets/                  CSS, the JavaScript game layer (ES modules, no bundler), service worker template
docs/                        GENERATED site, committed, served by GitHub Pages
guide/                       data-format.md, authoring.md
worker/                      optional accounts / leaderboard service (Cloudflare Worker + D1), see its README
notes/                       planning notes
```

## Adding a lesson

1. Add the lesson to `content/courses/<course>/course.json` (id, prerequisites, minutes) and its title/slug to `content/i18n/<lang>/courses/<course>/course.json` for every published language.
2. Copy `guide/lesson-template.json` to `content/i18n/<lang>/courses/<course>/lessons/<id>.json`, write the cards and the quiz (read `guide/data-format.md` and `guide/authoring.md`).
3. Add `content/courses/<course>/lessons/<id>.json` (people, concepts, ≥ 2 independent sources) and any new `people/`, `concepts/` and `bibliography/` entries with their translations.
4. Set `"status": "ready"` for the lesson in `course.json`.
5. `node scripts/validate.mjs` must be green, then `node scripts/build.mjs && node scripts/check-site.mjs`, then commit `content/` **and** `docs/`.

The validator refuses: unresolved `[[person:…]]`/`[[concept:…]]`/`[[lesson:…]]`/`[[cite:…]]` references, citations of unverified sources, a lesson with fewer than two independent sources, empty questions, questions without exactly one correct answer, missing sections, cycles or forward references in prerequisites, missing translations for a published language, and cards/questions whose structure differs between languages.

## Adding a new course

Create `content/courses/<new-course>/course.json`, `content/i18n/<lang>/courses/<new-course>/course.json`, and lessons as above. The engine has no course knowledge: every course gets its own map, exams, statistics and pages automatically.

## Adding a language

1. In `content/languages.json` the locale already exists with `status: "planned"`. Create `content/i18n/<lang>/` with `ui.json` (copy `en/ui.json`; every key must exist), `site/about.md`, `privacy.md`, `contact.md`, the course `course.json`, the lesson, people and concept files, and add the language's terms to `content/terminology/`.
2. **Slugs** are content, not derived: ASCII (`^[a-z0-9-]+$`) for every script that has a standard romanisation (Latin, Cyrillic, Greek, Chinese pinyin, Japanese romaji, Korean revised romanisation, Thai RTGS, Devanagari/Bengali simplified); native Unicode letters only for Arabic-script languages and Hebrew, where romanisation is lossy. The language's `slugPolicy` in `languages.json` says which.
3. **Quality gate.** Until a language passes the gate its status stays `beta`/`ui-only`: `noindex`, out of the sitemap and out of hreflang. The gate is: validator green (structure parity, references, placeholders, question counts and answer indexes), a review of a sample of the text by a native speaker, and consistency with the terminology glossary. Set `status: "published"` only after that. **Unreviewed bulk machine translation must not be indexed**: search engines may treat it as low quality.
4. Each published language needs a **moderation word list** for the (optional) account service, see [Moderation](#moderation-word-lists).
5. Pages of a translated-but-unreviewed language carry an *automatic translation* label and a "Suggest a translation fix" link (a GitHub issue).

Untranslated content falls back to English in the interface; a language with only the interface translated has no lesson pages (they are not generated), so no thin or duplicate pages are indexed.

## How the site is generated and published

`node scripts/build.mjs` writes to `docs/`: per-language static HTML (course page, lesson pages, person pages, concept pages, glossary, timeline, about/method, privacy, contact), noindex app pages (`/<lang>/app/…`), `sitemap.xml` (index) plus one sitemap per language with `xhtml:link` hreflang alternates, `robots.txt`, `404.html`, per-language web manifests, `sw.js`, and the JSON data bundles the game layer lazy-loads (`data/<lang>/…`). The build is deterministic (no timestamps), so only pages whose content changed produce a git diff. It aborts on any validation error and on any colour pair below its WCAG contrast threshold.

Publish (GitHub Pages): **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/docs`**. Commit `docs/` with the content. GitHub Pages limits are: published site ≤ 1 GB, ~10 builds/hour soft limit, 100 GB/month bandwidth soft limit. **Measured size:** a full lesson page is about 135 KB of HTML (about 45 KB gzipped), so the whole 93-lesson course with its people and concept pages is roughly 20 MB per language. **All 53 languages with the entire course would therefore reach about 1 GB, right at the limit.** That is not expected to happen soon (translation of the whole course into 53 languages is a very large job); watch the size (`du -sh docs`) and, if it approaches the limit, publish only the languages that passed the quality gate, or move to a host without this limit (for example Cloudflare Pages), which needs no change to the site itself.

### Changing the address (custom domain)

Edit `origin` and `basePath` in `site.config.json` (for a custom domain: the domain and `""`), rebuild, commit. Every canonical URL, hreflang alternate, sitemap entry and JSON-LD URL comes from there. Old URLs: GitHub Pages cannot issue real 301 redirects; renamed slugs get a static stub with `rel=canonical` and a meta refresh.

## SEO checklist

Implemented (and verified by `scripts/check-site.mjs`): indexable full-text static HTML per lesson, person and concept in every published language; language sub-path URLs with a fixed internal id and a translated slug; unique title and meta description; one `<h1>` and a sane heading order; self-referencing canonical; `<html lang>` and `dir`; reciprocal hreflang with `x-default`; Open Graph and Twitter Card tags; BreadcrumbList; JSON-LD `Course`/`CourseInstance`, `Article`+`LearningResource` (lessons), `Person` in a `ProfilePage`, `DefinedTerm`/`DefinedTermSet`, `WebSite`; per-language sitemaps and a sitemap index; 404 page; internal links (lesson ↔ prerequisites/next, lesson ↔ people/concepts, course ↔ all lessons); references, last-updated date, an about/method page, contact and a translation-status label on every page; user-specific pages (`/app/…`) are `noindex` and no personal data ever enters the static output; system font stacks (no web fonts, per-script stacks for CJK/Thai/Indic/Arabic/Hebrew), little JavaScript, and lesson text painted in the first response.

**Not verified / not guaranteed:** search ranking, indexing speed, Core Web Vitals in the field (the repository reports lab results only), and how Baidu, Naver or Yandex treat the site.

### Registering with search engines (your part)

Verification tags go into `site.config.json → searchEngineVerification` (the layout emits the right `<meta>` tag), then rebuild and commit.

1. **Google Search Console**: add a *URL-prefix* property `https://alplix.github.io/anemone/`, choose the *HTML tag* method, put the `content` value in `google`, rebuild/commit/push, click Verify, then *Sitemaps → add* `sitemap.xml`.
2. **Bing Webmaster Tools**: add the site (or import from Google Search Console), verify with the meta tag (`bing`), submit `https://alplix.github.io/anemone/sitemap.xml`.
3. **Yandex Webmaster**: add the site, verify with the meta tag (`yandex`), add the sitemap under *Indexing → Sitemap files*.
4. **Naver Search Advisor**: register the site, verify with the meta tag (`naver`), submit the sitemap under *Requests → Submit sitemap*.
5. **Baidu Ziyuan**: register, verify with the meta tag (`baidu`), submit the sitemap or URLs manually.

**Honest limits.** (a) On a `github.io` project path, `robots.txt` cannot live at the host root, so it is only emitted for reference; rely on the `noindex` meta tags and on submitting the sitemap in each webmaster tool. (b) A project path on a shared domain is weaker for SEO than an own domain (the project owner decided against a custom domain; the config makes switching a one-line change). (c) GitHub Pages can be slow or blocked in mainland China, and Baidu indexing of a `github.io` site tends to be weak. (d) Naver and Yandex need their own registrations, as above. (e) hreflang applies to languages that passed the quality gate only.

## Accessibility

Target: WCAG 2.2 AA. Semantic landmarks, one `<h1>`, a skip link, labelled controls, real `<button>`s, a page title that changes on every card, `aria-live` announcements for answers, badges and level-ups, focus management (heading of the new card, feedback after answering, dialog focus trap with ESC and return of focus), targets ≥ 44 px, visible focus ring, no colour-only information (icons and words accompany colour), reduced-motion support, adjustable text and spacing, tables and text summaries for statistics.

**Not done: testing with real screen readers (NVDA, JAWS, VoiceOver, TalkBack).** Automated audits (`scripts/check-site.mjs`, `scripts/check-contrast.mjs`, axe and Lighthouse runs) and keyboard checks are part of releases, but they do not replace testing with blind users. A manual checklist for that lives in `guide/accessibility-checklist.md`.

## Privacy

The site sets no cookies, has no analytics and loads nothing from third parties. Progress lives in `localStorage` (`anemone.state`, `anemone.settings`). Details: the site's Privacy page. Not legal advice; written with KVKK/GDPR awareness.

## Moderation word lists

The optional account service (in `worker/`) rejects offensive usernames, names, "about" texts and group names on the server (mandatory) and in the browser (convenience): normalisation (case, accents, Turkish `i/ı/İ`, `ğ ş ç ö ü`, leet-speak, separators between letters), substring matching for languages without spaces (CJK, Thai), an allow-list against the *Scunthorpe problem*, a report button and an admin review queue. Word lists come from the open list *List of Dirty, Naughty, Obscene, and Otherwise Bad Words* (LDNOOBW, CC BY 4.0) where it covers a language, and from hand-made lists elsewhere. **The filter is not perfect.** Every published language must ship its own list (the validator enforces it once accounts ship), and adding a language means adding its list.

## How the content is made

Everything here, code and text, was produced with AI assistance (Anthropic's Claude) under the direction of Alperen Yavuz, in a controlled multi-step process built for this project: source research, drafting from verified sources in original wording, verification of every citation against independent databases (Crossref, library and publisher records), automated validation, and revision. The project owner is responsible for what is published; the content has **not** yet been reviewed by a university lecturer, and Anemone is independent of İstanbul University/AUZEF (their course text was used only as a map of topics). The text is written in its own words, not copied from books; theories and facts are free to use and each lesson cites its sources. Translations are labelled until a native speaker has read them.

## Licence

- Source code (`scripts/`, `src/`, `worker/`): [MIT](LICENSE).
- Course content (`content/`, and the generated text in `docs/`): [CC BY-SA 4.0](LICENSE-CONTENT.txt): share and adapt with attribution, under the same licence.
- Word lists derived from LDNOOBW: CC BY 4.0, credit: the LDNOOBW contributors.
- Theories, facts and ideas are not owned by anyone; source works remain the property of their authors and are cited.
