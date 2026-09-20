# Authoring guide

Read `guide/data-format.md` first (the contract). This file is about *how to write*.

## Non-negotiables

1. **Accuracy over everything.** No invented citation, date, author, study detail, number, quote or biography. Every factual claim must be supported by at least two independent sources you actually opened (a primary work plus a textbook/review, or two reference works). If you cannot confirm something, **leave it out** and list it in `content/research-notes/<lesson-or-batch>.md` under "Could not verify". A shorter correct card beats a fuller uncertain one.
2. **Own words.** Never copy or closely paraphrase a book's sentences or structure (AUZEF course texts, Yaylagül, McQuail, Baran & Davis …). Facts, names, dates and ideas are free; the wording must be yours. Quotations: very short (<= 15 words), exact, attributed with source id, only when the exact words matter.
3. **Cite.** Put `[[cite:bib-id]]` after claims that come from a specific source (study results, dates, definitions). Only cite entries with `verified.status: "ok"`. Create bibliography entries only for sources you verified (Crossref for articles/DOIs; publisher, library catalogue, Open Library + a second source for books).
4. **No private data, no invented anecdotes.** A "story" card must be built from documented events (e.g. the 1968 Chapel Hill study) or be an explicitly hypothetical scenario labelled as such ("Imagine …"). Never present a made-up scene as fact.
5. **No sound, no images required.** The text must stand alone for a screen-reader user; describe things in words. No "see the figure".

## Make it a pleasure to learn (this is a product requirement)

The reader is a university student on a phone, tired, possibly with a disability. Every lesson must be complete and detailed **and** never boring:

- Open with a scene, a puzzle, a surprising documented fact or a question, not a definition. Then teach.
- One idea per card, 150–280 words, short paragraphs, concrete examples, plain sentences, an occasional dry joke. Address the reader as "sen" (Turkish informal), warm but never childish.
- Vary the cards: `story`, `steps`, `myth` ("what people assume / what the evidence says"), `lab` (a thought experiment or a tiny exercise), `text`. Never three identical kinds in a row.
- Mini questions must make the reader *think*, not just recognise a keyword; use scenarios ("A newsroom does X, which effect predicts Y?").
- Each `explain` says why the right answer is right *and* why the tempting wrong one is wrong.
- Depth goes into `deep` cards (4–8 per lesson): methods, sample sizes and measures (only if verified), theoretical lineage, historiography, disputes between scholars, what the original paper actually claimed vs what textbooks say it claimed. `core` cards stay light.
- The `exam` section is written for AUZEF-style students: the typical question patterns, the tempting distractors, the name/date pairs that get mixed up, and any alternative Turkish names the course books use for the same thing.
- The `critique` section is fair and specific (who criticised, on what grounds, what the theory's defenders replied). No strawmen.
- The `today` section connects to social media / digital life with real, documented research or clearly labelled reasoning, never hype.
- The `turkey` section only with solid sources (a documented Turkish case, a Turkish study, Turkish media history). If you cannot source it twice, leave the section out and say so in the research notes.

## Voice and terminology

- Turkish is the source language. Use the terms in `content/terminology/*.json`; add new terms to your own `content/terminology/<batch>.json` with `tr`, `en`, and where the Turkish term is disputed the alternatives and which course books use which. **Turkish term for spiral of silence is "suskunluk sarmalı"** (not "sessizlik sarmalı").
- Names: original spelling; first mention "Elisabeth Noelle-Neumann", afterwards the surname.
- Numbers, years and units written plainly. Avoid tables inside cards (screen readers and phones); use lists.

## Acceptance checklist for every lesson (run before you finish)

- [ ] all 12 sections present (turkey optional), summary last, at least 12 core cards and 4 deep cards
- [ ] each core card has a mini question; quiz has >= 8 questions incl. one of each: mcq, tf, match, order, cloze, case
- [ ] every `[[...]]` reference resolves to an existing (or roster-assigned) entry
- [ ] two independent sources per lesson in the lesson meta; every cited bib entry is `verified: ok`
- [ ] no sentence copied from a book; quotes <= 15 words
- [ ] `node scripts/validate.mjs` passes (when available) and JSON parses
- [ ] research notes file lists everything left out and every uncertainty
