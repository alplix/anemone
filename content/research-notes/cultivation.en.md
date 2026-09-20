# Translation notes: `cultivation` (English, 2026-09-20)

Files: `content/i18n/en/courses/mass-communication-theories/lessons/cultivation.json`, people `gerbner gross morgan signorielli hirsch potter`, concepts `cultivation cultural-indicators mainstreaming resonance mean-world-syndrome heavy-viewers message-system-analysis`. Status `machine` on all.

## Adaptations
- **Spelling**: British (colour, neighbourhood, programme) with -ize (Oxford), matching the existing English UI/course files.
- **Titles restored in English** (Turkish text gave them in translation): “The ‘Mainstreaming’ of America” (Gerbner et al. 1980), “A Curious Journey into the Scary World of Paul Hirsch” (1981), “Final Reply to Hirsch”, “Living with Television: The Violence Profile”. Titles taken from `content/bibliography/cultivation.json`. Only two verbatim English quotes occur in the lesson and both were already English in the Turkish file: “Cultivation is what a culture does” (6 words) and “a sense of danger, of mistrust, of meanness in the world” (11 words).
- **Turkish terms kept as quoted Turkish terms with an English gloss in parentheses**: ekme, yetiştirme, kültivasyon; kurumsal süreç / mesaj sistem / yetiştirme çözümlemesi; ilk düzey / ikincil düzey etkiler; kötü dünya sendromu, acımasız dünya sendromu; ağır izleyici, çok izleyenler, ağır seyirciler; ana akım, yaygın görüş hâline getirme, ana akımlaşma; rezonans, çifte doz; Kültürel Göstergeler ve Ekme Kuramı / Modeli. They also appear as `altTerms`. In the lesson the standard English terms are used everywhere else.
- **AUZEF** glossed once, in `exam-patterns`, as “the İstanbul University open and distance education faculty”.
- **Turkey card** (`turkey-studies`): one clause added for foreign readers: Ankara = Turkey’s capital; ATV, Kanal D, Star, Show TV = “all national channels in Turkey”; Baku = “the capital of Azerbaijan”. “Anadolu University Faculty of Science” left without a gloss (Turkish source names only the faculty). The Turkish source names the studies by author only (no paper titles are quoted in the lesson), so no title glosses were needed.
- **Survey question**: the Turkish text gives “Mahallenizde geceleri sokakta yürümeye çekinir misiniz?” as an example of a question style (from the MEF film) in the lesson, and a “sen” form (“Gece mahallende yürümekten çekinir misin?”) in the concept files. I rendered both as “Would you be afraid to walk … in your neighbourhood at night?”. This is a translation of the Turkish paraphrase, **not** the exact original wording (the film’s or the GSS wording was not checked). The Turkish campus variant became “Would you be afraid to walk alone on campus at night?”.
- Turkish “sen/siz” became “you”; the Turkish first-person notes (“Bilerek yüzde vermiyorum…”, “doğruladığım bir çalışma yok”) stay first person singular (“I am deliberately not giving percentages…”).
- Concept references `[[concept:cultural-indicators|Cultural Indicators]]` and `[[concept:cultivation|cultivation]]` in `message-system-analysis` use labels for grammar; ids unchanged.
- Cloze `q5` first blank sentence re-ordered slightly for English grammar; blanks, options and answers identical.
- `timeline`: the Turkish lesson file has **no** `timeline` object, so none was written in English. The event ids in the language-independent lesson meta (`violence-commission`, `surgeon-general-committee`, `violence-profile`, `doob-macdonald-toronto`, `mainstreaming-article`, `hughes-hirsch-reanalysis`, `potter-conceptual-critique`, `morgan-shanahan-meta-analysis`, `state-of-cultivation`, `meta-analysis-five-decades`, `social-media-meta-analysis`) therefore have no labels in either language. Labels must be added to both languages if the timeline page should show them.

## Checked against a source
- `deep-potter`: Turkish “kesinlik” = “precision”. Confirmed in the OpenAlex abstract of Potter 2014 (“heuristic value, empirical support, and precision”). Same wording used in the Potter person file.

## Doubts and places where the Turkish looked wrong or unclear (nothing corrected silently)
1. **“anlamsız” (Doob & Macdonald, within-neighbourhood correlation)**: translated “non-significant” (statistical reading). Literally “meaningless”.
2. **“aracı değişkenler”** (deep-moderators, 1997 meta-analysis): translated “moderators / moderating variables”. “Aracı” can also mean “mediating”; the original paper’s term was not checked.
3. **Fletcher ballad saying**: kept as the paraphrase given in the Turkish (the original is 23 words, over the quotation limit; see the Turkish research notes).
4. **“2 saat ve altı”** (Özer’s heavy/light threshold): rendered “two hours or less” with no “per day”. The `heavy-viewers` example says “a day” for its own hypothetical example. Whether Özer’s threshold is daily was not stated in the Turkish and I did not add it.
5. **Potter “eğitim teknolojisi”**: rendered “instructional technology”, the wording of the SAGE author page cited in the Turkish research notes.
6. **Gross bio**: “Penn’in duyurusu bu kitabı … öncü bir eser olarak anar” follows a list of several books; “this book” is ambiguous in the Turkish (probably *Up from Invisibility*). Rendered “the book”. “derneğin üyesidir” rendered “a member” (may be a fellow of ICA).
7. **“yönetim araştırması”** (Yaylagül critique) rendered “administrative research” (the standard English term for the Lazarsfeld tradition; Yaylagül’s own wording was not checked).
8. **Start of Cultural Indicators**: the exam card says Turkish sources may write “mid-1960s”, while other cards say “late 1960s” / 1967–68. This is intentional in the Turkish (a warning about differing sources) and kept.
9. **`ctx-bullet`**: “Belgeselde Morgan, Gerbner’in bakışını böyle aktarır” follows the sentence about “effect defined only as change” and it is not fully clear which part is Morgan’s relay. Kept literal.
10. **Hughes/Hirsch as “two researchers … national survey data”** (`critique-hirsch`): Hirsch’s reanalysis is of Gerbner et al.’s own findings (per the bibliography title); the card says both looked at “ulusal anket verisi”. Kept as is.
11. **`ozer-2019` / `ercan-demir-2015`**: the Turkish text says “Anadolu Üniversitesi Fen Fakültesi” for both; kept without claiming they are the same dataset.
12. **Terminology**: EN terms follow `content/terminology/*.json` (cultivation theory, heavy/light viewers, TV answer, message system analysis, mean world syndrome, mainstreaming, resonance, Third Voice, happy violence, first-/second-order measures, ceiling effect). Concept slugs: `cultivation-theory`, `cultural-indicators-project`, `mainstreaming`, `resonance`, `mean-world-syndrome`, `heavy-viewers`, `message-system-analysis`. The concept slug `cultivation-theory` equals the lesson slug; they are in different sections.

## Validator
`ANEMONE_PUBLISH=en node scripts/validate.mjs`: no error for the cultivation lesson, its six people or its seven concepts (remaining errors concern other authors’ files).
