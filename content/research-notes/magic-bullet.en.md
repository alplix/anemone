# Translation notes: `magic-bullet` (English, 2026-09-20)

Files: `content/i18n/en/courses/mass-communication-theories/lessons/magic-bullet.json`, people `lasswell cantril`, concepts `magic-bullet powerful-effects suggestibility`. Status `machine` on all.

## Adaptations
- **Spelling**: British (colour, programme, organised, behaviourist), matching the existing English files; “per cent” written out.
- **Quotations stay in the original English** wherever the Turkish text already quoted the English original (all ≤ 12 words): “Thoughts are Bullets”, “I have elsewhere called this the Bullet Theory of communication”, “shot full of holes”, “propaganda is one of the most powerful instrumentalities in the modern world”, “new hammer and anvil of social solidarity”, “atomized world”, “chains of silver”, “more can be won by illusion than by coercion”, “injected into the veins”, “no single observable variable”, “textbook boilerplate”, “Remembering the Straw Man”, “mystery-adventure story of the American people”, “critical faculty”. Turkish glosses of these in the source (for example “gümüş zincirler” next to “chains of silver”) were dropped or turned into plain English.
- **Turkish terms kept as Turkish with an English gloss** in three places: `claim-textbook`, `concepts-terms`, `exam-patterns` (*hipodermik iğne*, *sihirli mermi*, *uyarıcı–tepki*, *propaganda modeli*). They are the Turkish names used by Yaylagül (2006) and are exam-relevant for Turkish readers; the same names are `altTerms` of the concept `magic-bullet`.
- **Yaylagül** is named only as an author (Turkish course-book author); no institution.
- **Concept slugs**: `hypodermic-needle-magic-bullet`, `powerful-effects-assumption`, `suggestibility`. Person slugs: `harold-lasswell`, `hadley-cantril`.
- **Turkish “Hâkim ol”** (lab card) became “Be the judge”; **“hafıza kancası”** became “memory hook”.
- The Turkish exam card (`exam-patterns`) speaks to readers of Turkish sources; in English the clause “(in Turkish sources)” was added to the alternative-names paragraph.
- **First-person notes** of the Turkish source (“çıkaramadım”) remain first person singular (“I could not tell from the sources …”, in `deep-numbers`).
- **`timeline`**: labels translated (same event ids).
- **Titles**: “Sanılan” → “What people assume”; “Kayıtlar ne söylüyor?” → “What the records say”.

## Doubts
1. **“ders kitabı sürümü / tarihsel sürüm”** → “textbook version / historical version”. Chosen consistently.
2. **“şırınga” vs “hypodermic needle”**: Turkish uses *şırınga* (syringe) as the title word and *hipodermik iğne* for the academic name; English text uses “hypodermic needle” for both and mentions “syringe” only where the Turkish source does (Yaylagül’s image, the search for “syringe” in Lasswell).
3. **“kukla rakip”** (Turkish gloss of *straw man*) → “dummy rival”. The English concept text glosses *straw man* as “a rival view distorted so that it is easy to refute”.
4. **“telkin edilebilirlik”** → “suggestibility”; **“telkin öğretisi”** → “suggestion doctrine” (Parsons 2021); **“eleştirel yeti”** → “critical ability / critical faculty” (Cantril’s words).
5. **Question `q6`** (case): part ids kept (`q6a`–`q6c`); wording adapted only for English grammar; answer indexes identical.
6. **Cloze `q5`**: blanks, options and answers identical.

## Validator
`ANEMONE_PUBLISH=en node scripts/validate.mjs`: 0 errors, 0 warnings (with the lesson temporarily set to `ready`; the status was reverted to `planned` before committing).
