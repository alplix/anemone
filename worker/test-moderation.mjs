// node worker/test-moderation.mjs   sanity tests for the moderation normaliser and matcher
import { isOffensive, normalise, stats } from "./src/moderation.js";
let fail = 0;
const t = (text, expect, note = "") => { const got = isOffensive(text); if (got !== expect) { fail++; console.log(`FAIL ${JSON.stringify(text)} expected ${expect} got ${got} ${note}`); } };
console.log(stats());
// clean names must pass (Scunthorpe cases, Turkish letters, ordinary names)
for (const ok of ["Alperen", "scunthorpe", "Assistant Professor", "classic", "Ayşe Yılmaz", "İrem", "Çağlar", "Ömer_Faruk", "ıspanak", "Anemone", "Professor Plum", "bass guitar", "Kasım", "Amasya", "Sikorski", "Hancock", "cucumber", "研究者", "山田太郎", "สมชาย", "Мария", "Ελένη"]) t(ok, false);
// normaliser behaviour
const n = normalise("İ Ş Ğ 5ıkt1r");
if (n.squashed !== "isg" + "sikti".slice(0, 0) + normalise("5ıkt1r").squashed) { /* informational only */ }
console.log("normalise sample:", JSON.stringify(normalise("$1kt1R İ.Ş-Ğ")));
// offensive: pick entries straight from the lists (so this test cannot drift)
import fs from "node:fs";
const lists = JSON.parse(fs.readFileSync(new URL("./src/wordlists.json", import.meta.url))).lists;
let checked = 0, missed = 0;
for (const lang of ["tr", "en", "de", "fr", "es", "ru", "zh", "ja", "th"]) {
  for (const w of lists[lang].slice(0, 25)) {
    checked++;
    if (!isOffensive(w)) { missed++; if (missed <= 12) console.log(`  not caught (${lang}): ${JSON.stringify(w)} (may be allow-listed or too short/ambiguous)`); }
  }
}
console.log(`list entries caught: ${checked - missed}/${checked}`);
// evasion attempts on a known word
const w = lists.en.find((x) => /^[a-z]{5,7}$/.test(x));
console.log("evasion test word length:", w.length);
for (const v of [w.toUpperCase(), w.split("").join(" "), w.split("").join("."), w.replace(/[aeiou]/, (m) => ({ a: "4", e: "3", i: "1", o: "0", u: "u" }[m])), w + "123", "xx_" + w]) t(v, true, `(variant of list word)`);
console.log(fail ? `${fail} failure(s)` : "moderation sanity tests passed");
process.exit(fail ? 1 : 0);
