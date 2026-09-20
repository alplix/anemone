# Anemone data format (v1)

Everything the site shows is data under `content/`. The build (`node scripts/build.mjs`) turns it into static HTML under `docs/`; the validator (`node scripts/validate.mjs`) checks it. **The engine contains no course knowledge.**

## Layout

```
content/
  languages.json                              locale registry (status, dir, script, slug policy)
  terminology/terms.json                      fixed term glossary per language (brief for translators)
  bibliography/*.json                         verified sources, merged by id (one file per batch is fine)
  people/<id>.json                            language-independent person facts
  concepts/<id>.json                          language-independent concept facts
  courses/<course>/course.json                units, order, prerequisites, minutes, AUZEF map
  courses/<course>/lessons/<lesson>.json      language-independent lesson meta (people, concepts, sources)
  i18n/<lang>/ui.json                         interface strings
  i18n/<lang>/site/*.md                       about / method / privacy pages (Markdown-lite)
  i18n/<lang>/courses/<course>/course.json    course + unit + lesson titles, slugs, descriptions
  i18n/<lang>/courses/<course>/lessons/<lesson>.json   the lesson text (cards + quiz)
  i18n/<lang>/people/<id>.json                person text
  i18n/<lang>/concepts/<id>.json              concept text
```

IDs are stable English kebab-case (`agenda-setting`, `mccombs`, `mccombs-shaw-1972`). They never change. URL slugs are per language and live in the i18n files.

## Markdown-lite (body fields)

Paragraphs are separated by a blank line. Supported: `**bold**`, `*italic*`, `- ` bullet lists, `1. ` numbered lists, `> ` short quotations, `[text](https://...)` external links.
Inline references (validated, must resolve):

- `[[person:mccombs]]` or `[[person:mccombs|McCombs]]` – person (panel with JS, plain link without JS)
- `[[concept:priming]]` / `[[concept:priming|önceleme]]` – concept
- `[[lesson:framing]]` – another lesson (may be `planned`)
- `[[cite:mccombs-shaw-1972]]` – numbered citation marker that links to the lesson's reference list

No raw HTML. Never put personal data anywhere.

## Bibliography entry (`content/bibliography/*.json`, an object keyed by id)

```json
"mccombs-shaw-1972": {
  "type": "article",
  "authors": ["McCombs, Maxwell E.", "Shaw, Donald L."],
  "year": 1972,
  "title": "The agenda-setting function of mass media",
  "container": "Public Opinion Quarterly", "volume": "36", "issue": "2", "pages": "176-187",
  "doi": "10.1086/267990",
  "verified": { "status": "ok", "methods": ["crossref", "publisher-page"], "date": "2026-09-20", "note": "" }
}
```
`type`: `article | book | chapter | report | web | thesis`. Books: `publisher`, `place`, `edition`, optional `originalYear`/`originalTitle` (e.g. Horkheimer & Adorno: originalYear 1947). Chapters: `editors`, `bookTitle`. Web (encyclopaedia entries, institutional pages): `url`, `publisher`, `accessed` (ISO date).
`verified.status` is `ok` only when the record was actually matched against an independent database or the source itself (Crossref, publisher/journal page, Library of Congress / national library catalogue, Open Library + a second source, archived page). Use `unresolved` (with a `note`) when it could not be confirmed. **Content may only cite `ok` entries**; anything `unresolved` must not appear in published text.

## Person (`content/people/<id>.json`, language-independent)

```json
{ "id": "mccombs", "born": { "year": 1938 }, "died": null,
  "sources": ["bio-source-1", "bio-source-2"],   // >= 2 independent, verified bibliography ids (encyclopedias, obituaries, institutional pages, national biographies)
  "works": ["mccombs-shaw-1972"] }
```
Only years that both sources agree on. Living people: no birth date beyond the year, no private details, no addresses; only publicly documented professional facts. If a birth or death year cannot be confirmed by two sources, omit the field.

## Concept (`content/concepts/<id>.json`)

```json
{ "id": "priming", "family": "effects", "introducedBy": ["iyengar"], "related": ["agenda-setting"], "sources": ["iyengar-peters-kinder-1982", "..."] }
```
`family`: `models | society | effects | news | audience | technology | critical | culture | normative | digital | method`.

## Lesson meta (`content/courses/<course>/lessons/<lesson>.json`)

```json
{ "id": "agenda-setting",
  "people": ["mccombs", "shaw", "lippmann"],
  "concepts": ["agenda-setting", "priming", "salience"],
  "sources": [ { "bib": "mccombs-shaw-1972", "role": "primary" }, { "bib": "mcquail-2010", "role": "textbook" } ],
  "timeline": [ { "year": 1968, "id": "chapel-hill-study" } ] }
```
At least two independent `sources` (a textbook or review counts as independent of a primary study). Every `[[cite:...]]` in the text must be listed here.

## Lesson text (`content/i18n/<lang>/courses/<course>/lessons/<lesson>.json`)

```json
{
  "id": "agenda-setting", "lang": "tr",
  "translation": { "status": "source", "date": "2026-09-20" },
  "title": "Gündem Belirleme", "slug": "gundem-belirleme",
  "description": "<= 160 chars, unique meta description",
  "claim": "The one-sentence core claim (Temel iddia).",
  "keywords": ["gündem belirleme", "McCombs", "Shaw"],
  "updated": "2026-09-20",
  "cards": [
    { "id": "hook", "section": "context", "layer": "core", "kind": "story",
      "title": "Card title", "body": "Markdown-lite ...",
      "question": { "id": "hook-q", "type": "mcq", "prompt": "...", "options": ["...", "...", "...", "..."], "answer": 1, "explain": "..." } }
  ],
  "quiz": [ { ...questions } ]
}
```

`translation.status`: `source` (authoring language) | `machine` (AI translation, not yet read by a native speaker) | `reviewed` (native speaker reviewed).

**Sections** (`section`), in this order, each with at least one `core` card, except `turkey` (only when solid, sourced material exists) and `summary` is always the last card:
`context` (Bağlam ve doğuş) → `people-time` (Kimler, ne zaman) → `claim` (Temel iddia) → `concepts` (Kavramlar sözlüğü) → `assumptions` (Varsayımlar) → `how-it-works` (Nasıl işler, adım adım) → `evidence` (Kanıtlar/çalışmalar) → `critique` (Eleştiriler ve sınırlar) → `today` (Günümüz uygulaması) → `turkey` (Türkiye'den örnek) → `exam` (Sınavda böyle sorulur) → `summary` (Özet kartı).

**Layers**: `core` (the path everyone reads, 60–120 s per card, ~150–280 words) and `deep` (optional deep dive: methodology details, numbers, primary-source nuance, historiography; anyone who wants the finest detail opens them). `kind`: `text | story | steps | myth | lab | summary`. `story` opens with a scene or a concrete case; `myth` is "what people think / what the evidence says"; `lab` is a thought experiment or a hands-on mini-exercise; `steps` is a numbered mechanism.

**Questions** (`question` on a card = mini question, 1 per core card; `quiz` = lesson-end questions, at least 8, mixing types, at least one `case`):

| type | fields |
|---|---|
| `mcq` | `prompt`, `options` (3–5), `answer` (index), `explain` |
| `tf` | `prompt`, `answer` (true/false), `explain` |
| `match` | `prompt`, `pairs` (3–6 `[left, right]` pairs, right side unique), `explain` |
| `order` | `prompt`, `items` (3–7 strings **in correct order**; the engine shuffles), `explain` |
| `cloze` | `prompt`, `text` with `{{1}}`, `{{2}}`…, `blanks` = `[{ "options": [..], "answer": 0 }]`, `explain` |
| `case` | `scenario`, `parts` = 2–3 `mcq` objects, `takeaway` |

Every question has a unique `id` within the lesson, an `explain` that teaches (why the right answer is right AND why a tempting wrong one is wrong), and works for a screen-reader user (no drag and drop, no "look at the picture"). There must be exactly one correct answer for `mcq`. Do not put the answer in the prompt.

## People / concept text

`content/i18n/<lang>/people/<id>.json`:
```json
{ "id": "mccombs", "lang": "tr", "name": "Maxwell McCombs", "nativeName": "", "slug": "maxwell-mccombs",
  "short": "<= 200 chars: who, when, what for", "born": "place (optional)", "died": "place (optional)",
  "roles": ["gazetecilik profesörü"], "bio": "Markdown-lite, 180–320 words, own words",
  "works": [ { "bib": "mccombs-shaw-1972", "note": "one line about why it matters" } ],
  "inCourse": "Markdown-lite, 1–3 sentences: how they appear in this course (concepts, lessons)" }
```
`content/i18n/<lang>/concepts/<id>.json`:
```json
{ "id": "priming", "lang": "tr", "term": "öncüleme", "altTerms": [], "slug": "onculeme",
  "short": "<= 40 words definition", "body": "Markdown-lite, 120–250 words", "example": "one concrete example" }
```

## Rules the validator enforces

- every reference resolves; every `[[cite:]]` is listed in the lesson meta and points at a `verified: ok` bibliography entry
- prerequisite graph is acyclic and points to earlier lessons; no orphan lessons
- every published language has every person/concept/lesson entry for lessons that are `ready` (parity), same question counts, same answer indexes, same placeholders
- questions: non-empty prompts, exactly one correct answer, valid indexes, unique ids
- unique slugs per language and section; slug charset per the language's `slugPolicy`
- every published language has a profanity list configured for the moderation filter (when accounts ship)
- contrast of every colour token pair, hreflang reciprocity, sitemap ↔ pages, no broken internal links (build-time checks)
