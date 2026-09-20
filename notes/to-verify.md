# Things that still need a human check (consolidated 2026-09-20)

Nothing below is presented as certain in the lessons; each item is either left out of the text or attributed in the sentence. Full detail: `content/research-notes/*.md` (per lesson, Turkish source) and `*.en.md` (translation notes).

## Not yet done by anyone
- **No academic has reviewed the lessons.** Nothing has been read by a lecturer or by a subject expert. The About page says so.
- **No real screen-reader test** (NVDA/JAWS/VoiceOver/TalkBack): use `guide/accessibility-checklist.md`.
- **English is an AI translation** (`translation.status: machine`, the pages show an "automatic translation" label) and has not been read by a native speaker.
- **Course-book comparison:** the AUZEF course text (Polat 2016) and Yaylagül were only read for their tables of contents. The lessons could not confirm which Turkish term each book uses for every concept; the exam cards therefore tell students to use their own book's term. Please compare with the exact AUZEF book edition you use.

## Facts marked uncertain by the authors (left out or attributed)
Agenda-setting: Shaw's birth year; Lazarsfeld's Columbia appointment and retirement years (sources disagree); McCombs's exact death day (8 vs 9 Sept 2024) and birthplace; several follow-up studies known only from abstracts; the Charlotte 1972 study details (sample size, waves); newspaper-vs-television results and the time-lag summary rest on McCombs's own 1976 review (attributed in the text); the *Türkiye* card rests on two Turkish papers, each with its own DergiPark/Crossref record, not on two independent studies of one finding; the Lewin 1947 origin claim for "gatekeeping" is NOT made.
Cultivation: exact percentages of the 1976 "TV answer" questions (sources disagree, none given); the "4+ hours = heavy viewer" threshold (varies; not asserted); start year of Cultural Indicators ("late 1960s"); Gross's birth year; Hirsch has only one true biography source (minimal entry); Signorielli's two sources are the same 2010 announcement; the Turkish terms "ana akımlaşma" (own derivation from "ana akım"), "ağır izleyiciler", "kötü dünya sendromu" are weakly attested and flagged `check` in `content/terminology/cultivation.json`; no cultivation study specific to streaming or personalised feeds could be verified (the "today" card says so).
Spiral of silence: the primary works (Noelle-Neumann 1974, 1980/1984) were paywalled, so the theory's content is taken from secondary sources that were read (Griffin's textbook chapter, Polat, Yaylagül, the Noelle-Neumann site, Wilke, Petersen, Glynn et al. via abstracts); the 3-4 % last-days swing, the Queen's visit, the names Erhard/Brandt and the Bogart 1991 dispute are left out (Wikipedia-level sources only); Noelle-Neumann's Nazi-era journalism is stated only where two historians (Wilke 2010, Wendelin 2013) agree; Glynn's biography is minimal; Turkish terms for "quasi-statistical sense" ("yarı istatistiksel algı"), "our social skin", "train test" are unsettled; the 1972 Tokyo talk date rests on Wilke alone.
Terminology: in the quiz `quiz-alt-names` (spiral lesson) the word "sessizlik" appears once because Polat's unit title uses "Sessizlik Sarmalı" while its section title and Yaylagül use "Suskunluk Sarmalı". Remove the question if you want the word to appear nowhere.

## Bibliography conflicts from the curriculum research (not used in lessons yet)
Open Library gave a different first-publication year than the one assumed for: Horkheimer & Adorno (1944/1947), Habermas *Strukturwandel* (1962), Marcuse (1964), Barthes *Mythologies* (1957), Saussure (1916), Debord (1967), Durkheim *Règles* (1895), Le Bon (1895), Tönnies (1887), Tarde (1890), Ang (1985; Dutch original 1982), McQuail (first edition 1983). They must be resolved with a second source before those lessons are written.
Not found in any database: Castells 1996, Lyotard 1979, Morley 1980, Smythe 1977, Noelle-Neumann 1973 and 1984 English edition, Wardle & Derakhshan 2017, Lasswell 1948, Schramm 1954, Dance 1967, and others (list in `notes/curriculum-draft-v0.md`, section 10).

## Infrastructure caveats
- LDNOOBW moderation lists exist for 24 files covering only part of the 53 locales; 27 locales have no list (`worker/src/wordlists.json` → `missing`). Accounts must not be enabled for those languages until they get one.
- GitHub Pages project sites cannot serve a root `robots.txt`; rely on `noindex` meta tags and submit the sitemaps by hand.
- The full course in all 53 languages would be about 1 GB on Pages (limit 1 GB); measured 135 KB per lesson page.
