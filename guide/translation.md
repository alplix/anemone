# Translation guide

Read `guide/data-format.md` first. Turkish (`tr`) is the source language; every other language is a translation of the *validated* Turkish files. Translation is not paraphrase: the structure must be identical so the validator's parity checks pass.

## What must stay identical

- every `id` (cards, questions, people, concepts, lessons), `section`, `layer`, `kind`
- the number and order of cards; the number, type and order of questions; answer indexes; the number of `options`, `pairs`, `items`, `blanks`
- every `[[person:…]]`, `[[concept:…]]`, `[[lesson:…]]` and `[[cite:…]]` reference (same ids, same places; you may change the label after `|`)
- numbers, years, names of works and their years (transliterate names only where the target script requires it; keep the original spelling in Latin scripts)
- Markdown-lite structure (lists stay lists, bold stays bold)

## What you translate

Titles, bodies, question prompts, options, explanations, quotes' *surrounding* text (a short quotation is translated only if it was given in translation in the source; otherwise keep the original wording and say so), person biographies, concept definitions, descriptions and claims. `description` stays ≤ 160 characters.

## Terminology

Use `content/terminology/*.json` for the fixed terms. If a term has no entry for your language, look for the established academic usage in your language (textbooks, national encyclopedias) and add it to `content/terminology/<lang>-<batch>.json` with `status: "check"` and a note. For English: *agenda-setting*, *spiral of silence*, *cultivation theory*, *uses and gratifications*, *priming*, *framing*, *gatekeeping*, *two-step flow*, *knowledge gap hypothesis*.

## Slugs

`slug` is content: ASCII `^[a-z0-9]+(-[a-z0-9]+)*$` for every language whose `slugPolicy` in `content/languages.json` is `ascii` (short, readable, no diacritics; the translation of the title). Person slugs are the person's name (`maxwell-mccombs`); concept slugs are the translated term. Slugs must be unique per section per language and must match `course.json` for lessons.

## Voice

Keep the register and the humour of the source: friendly, direct, curious, never childish. Do not add facts, sources or examples that are not in the Turkish file; do not remove any. If a sentence only works in Turkish (a pun, a Turkish example), adapt it so it teaches the same thing, and say so in the notes file.

## Sources and the Turkish course

`turkey` cards (examples from Turkey) stay in the translation with the Turkish context explained in one clause for foreign readers.
## Status flag

Set `"translation": { "status": "machine", "date": "<today>" }` on lesson files (and add `"translation": { "status": "machine" }` to people and concept files). It becomes `reviewed` only after a native speaker has read the text. The site shows an "automatic translation" label until then.

## Checklist

- [ ] `node scripts/validate.mjs` reports no error for your language (parity with the source)
- [ ] no Turkish left in the file (search for the Turkish letters ç ğ ı ö ş ü İ)
- [ ] terminology matches the glossary
- [ ] notes file lists every adaptation, every doubt
