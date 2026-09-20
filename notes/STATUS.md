# Anemone: working status (updated 2026-09-20, night session)

Owner: Alp (Alperen Yavuz). Language of replies: Turkish. Repo/files/README: English. NO SOUND anywhere.
Decisions (approved): repo `alplix/anemone`, MIT (code) + CC BY-SA 4.0 (content), Cloudflare Worker + D1 for accounts/leaderboard, 53 locales in 3 phases, no custom domain (GitHub Pages `https://alplix.github.io/anemone/`, basePath `/anemone`), Turkish term is **suskunluk sarmalı**, curriculum v1 = 93 lessons / 11 units (`content/courses/mass-communication-theories/course.json`, readable in `notes/curriculum-v1.md`).
Authorship wording (owner's wish, adapted for honesty): "Coded and written by Alperen Yavuz, with AI assistance" in the footer + About/Method page + README. Do NOT claim the AI was "trained only on public copyright-free content" (unverifiable, false for the model); state instead: original wording, sources cited, citations verified.

## Done
- Content model + validator, static build (pages, hreflang, sitemaps, JSON-LD, manifests, SW, data bundles), theme/contrast generator (402 pairs pass), CSS, JS game layer (reader, 6 question types, XP/ranks/badges, Leitner review, mistakes notebook, exams, stats, settings, panels, offline pack, tips, account/leaderboard/profile client), UI strings tr+en (+ ui.account.json).
- Vertical slice, Turkish, VERIFIED BY VALIDATOR: agenda-setting (21 core + 8 deep cards, 13-question quiz), cultivation (20+8, 12 q), spiral-of-silence (27+6, 13 q) + 14 people + 21 concepts + ~129 bibliography entries (all `verified: ok` by the authors' checks; see `content/research-notes/*.md` for what was left out).
- QA (local): axe 0 violations on all page types in 6 themes; Lighthouse mobile perf 98-100 / a11y 100 / bp 100 / seo 100; e2e (Playwright) passes: reader, all question types, quiz, review, exam, panel (ESC + focus), themes.
- Worker code + tests: local `wrangler dev` smoke test passes (register, recover, profile visibility incl. under-18 rule, sync clamp, cloud save, leaderboard, groups, report, export, delete, offensive-name refusal).
- Cloudflare (Alp's account, free plan): D1 database `anemone` CREATED (id in worker/wrangler.toml), schema APPLIED (remote), secrets ADMIN_TOKEN + THROTTLE_SALT uploaded (values in `.secrets/`, git-ignored), a Worker shell named `anemone-api` was created by `secret put`. **The Worker itself was NOT deployed: the harness blocked `wrangler deploy` ("Production Deploy")**. Alp must run it or allow it (see below). apiBase in site.config.json is still empty, so the live site shows "accounts not switched on yet".

## To deploy the Worker (Alp)
```bash
cd worker
npx wrangler deploy                       # prints https://anemone-api.<subdomain>.workers.dev
node smoke-test.mjs https://anemone-api.<subdomain>.workers.dev https://alplix.github.io
```
then put the URL into `site.config.json` -> `apiBase`, rebuild (`node scripts/build.mjs`), commit + push. To undo everything: `npx wrangler delete` and `npx wrangler d1 delete anemone`.

## In progress
- 3 English-translation agents (agenda-setting, cultivation, spiral-of-silence + their people/concepts). While they write, `content/i18n/en` may be incomplete/invalid. `content/languages.json` has `en` status **planned** (flip to `published` when `ANEMONE_PUBLISH=en node scripts/validate.mjs` is green).

## Next
1. Integrate EN, flip en to published, build to docs/, commit (Co-Authored-By trailer), create repo alplix/anemone, push, enable Pages (main /docs), verify live (check-site + Lighthouse on live URLs).
2. Scale content by priority (AUZEF track first); languages phase 2/3 with quality gates.
3. Ask Alp: real-screen-reader test (guide/accessibility-checklist.md), an academic reviewer, "Türkiye" example sources.

## Facts verified (keep)
- Crossref confirmed 17 journal citations; Open Library conflicts listed in `notes/curriculum-draft-v0.md` section 10.
- KV free: 1,000 writes/day. D1 free: 100k row writes/day, 5M row reads/day, 5 GB. GH Pages: 1 GB site, 10 builds/h soft.
- LDNOOBW is CC BY 4.0 with 24 usable language files; 27 of our locales have NO list (uk id vi bn ms ur he ro el bg sk hr lt lv sl et sr-Latn sr-Cyrl bs sq mk ca is eu gl ga mt).
- github.io project sites cannot serve a host-root robots.txt.
