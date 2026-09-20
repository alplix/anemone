# Translation notes: `chicago-school` (English, 2026-09-20)

Files: `content/i18n/en/courses/mass-communication-theories/lessons/chicago-school.json`, people `park burgess thomas wirth dewey`, concepts `chicago-school human-ecology thomas-theorem immigrant-press urbanism news-as-knowledge social-laboratory`. Status `machine` on all.

## What stayed identical

Card ids, sections, layers, kinds, question ids/types/answer indexes, number of options, pairs, items and blanks, and every `[[person:]]`, `[[concept:]]`, `[[lesson:]]` and `[[cite:]]` reference (checked by script before running the validator: 0 parity problems). Numbers, years, names of works and their years are unchanged.

## Adaptations

- **Spelling**: British (colour, neighbourhood, labour, programme), matching the existing English files. Inside quotations the original American spelling is kept (for example “leveling”).
- **Quotations**: the source-language English quotations (Dewey, Wirth, Thomas and Thomas, Park, Park and Burgess, Merton) are given in their original wording in both files. The Turkish file gives a Turkish rendering of the shorter ones (for example “Köyde herkes herkes hakkında her şeyi bilir”, “beş sözcükten birini anlıyorum”); the English file restores the exact English words, which is why the English versions could be re-checked against the primary texts. Every quoted fragment is 15 words or fewer.
- **The Dewey word play** (*common - community - communication*): it works in English, so the English card keeps it as it stands and keeps the Turkish aside as a short remark that the Turkish words for “common”, “community” and “communication” are not related (both cards carry the same remark). No Turkish words appear in it.
- **Turkish names kept inside the English text, with a gloss**: the `exam-patterns` card lists the Turkish names of the school in use (“Chicago Okulu”, “Şikago Okulu”, “Chicago Sosyoloji Ekolü”, “ekoloji okulu”, “ekolojik okul”), the Turkish terms for human ecology and the social laboratory (“insan ekolojisi”, “sosyal laboratuvar”) and one Turkish rendering of Wirth's article title (“Bir Yaşam Biçimi Olarak Kentlileşme”); the concept files `chicago-school` and `urbanism` repeat the same names. Turkish letters that remain in the English files are only these names and German place names (Gemünden, Göttingen, Związkowy, Świąteczna).
- **Person and concept slugs** are ASCII English forms (`robert-park`, `william-i-thomas`, `thomas-theorem` ...); `urbanism` keeps its Turkish alternative `kentlileşme` only in the Turkish file.
- **Titles** follow `course.json` exactly: “The Chicago School and Communication”, slug `chicago-school`.

## Doubts for a reviewer

- “Thought News” and other proper names are left untranslated by design.
- “Storytelling system” for the Ball-Rokeach et al. concept is taken from the paper's abstract; “communication infrastructure” is the same authors' wider term and is used only in the terminology file.
- The sentence “Same paper, different job” (the cigarette-paper joke) is a light adaptation of the Turkish “Kağıt aynı kağıt, iş değişmiş”, keeping the same meaning.
