# Translation notes: `mass-media-history` (English, 2026-09-20)

Files: `content/i18n/en/courses/mass-communication-theories/lessons/mass-media-history.json`, people `gutenberg muteferrika day`, concepts `mass-media movable-type penny-press news-agency broadcasting`. Status `machine` on all.

## Adaptations
- **Spelling**: British (colour, programme, licence) with -ize where the existing English files use it; matches the existing English UI and lessons.
- **Structure**: same ids, sections, layers, kinds, card order, question types and answer indexes as the Turkish file; every `[[person:]]`, `[[concept:]]`, `[[lesson:]]` and `[[cite:]]` reference kept in the same place (checked by the validator's parity test).
- **Titles and slug** follow `content/i18n/en/courses/mass-communication-theories/course.json` ("A History of Mass Media", `history-of-mass-media`).
- **Timeline labels** (the `timeline` object of the lesson file) are translated too; the timeline page uses them per language.
- **Turkish names kept** for Ottoman and Turkish institutions and works (Takvim-i Vekayi, Ceride-i Havadis, Tercüman-ı Ahval, Tasvir-i Efkâr, Vankulu Lügati, *Vesîletü't-tıbâa*, Anadolu Ajansı rendered "Anadolu Agency", TRT explained as "Turkish Radio and Television Corporation"). "Firman" and "fatwa" are kept as English loanwords and glossed in the glossary card.
- **`turkey` section**: as required by `guide/translation.md`, the Turkish context is explained in one clause (e.g. "the Young Ottomans", "state gazette", "TRT") for foreign readers; no facts were added.
- **Turkish-only remark adapted**: in `concepts-broadcast` the closing observation about the Turkish word "yayın" and the verb "yaymak" is kept with a short English gloss so that it still teaches the same thing (English has no such pair).
- **The exam card** keeps the Turkish names of the terms ("kitle iletişim araçları", "medya", "haber ajansı") in quotation marks with English glosses, because the point of that paragraph is which Turkish names appear in Turkish course materials.
- **Quotations**: the one direct English quotation (Gessner's "confusing and harmful abundance of books", as translated in Blair's article) is kept in English in both languages; the Pepys remark is paraphrased in both languages because the source gave it only in English and I did not want to put translated words in quotation marks.
- **Hypothetical scenarios** keep their labels ("Hypothetical example.", "Imagine it is 1729 ...").
- **Terminology** follows `content/terminology/core.json` and `content/terminology/mass-media-history.json`. "Penny press" is kept in English in Turkish and English.

## Doubts
- The Turkish humour in a few sentences (e.g. "Biz boşluğu boş bırakıyoruz", "the gap empty") is kept close to literal; a native reviewer should check whether it reads as dry rather than flat.
- Quiz option texts in the English `match` question (dates as right-hand items) are numerals, unchanged.
