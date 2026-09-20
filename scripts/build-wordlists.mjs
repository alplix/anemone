// node scripts/build-wordlists.mjs   (needs network)
// Downloads the LDNOOBW lists (CC BY 4.0, https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words)
// for the languages it covers and writes worker/src/wordlists.json for the moderation filter.
// Languages without a list are recorded under "missing": the validator refuses to publish accounts for them.
import path from "node:path";
import { ROOT, writeFile, readJson } from "./lib/util.mjs";

const RAW = "https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/";
// Anemone locale -> LDNOOBW file
const MAP = { tr: "tr", en: "en", de: "de", fr: "fr", es: "es", "pt-BR": "pt", "pt-PT": "pt", ru: "ru", "zh-Hans": "zh", "zh-Hant": "zh", ja: "ja", ko: "ko", it: "it", pl: "pl", nl: "nl", ar: "ar", hi: "hi", th: "th", fa: "fa", fil: "fil", cs: "cs", sv: "sv", hu: "hu", da: "da", fi: "fi", nb: "no" };

const langs = readJson(path.join(ROOT, "content", "languages.json")).languages;
const files = [...new Set(Object.values(MAP))];
const lists = {};
for (const f of files) {
  const res = await fetch(RAW + f);
  if (!res.ok) { console.error(`failed ${f}: ${res.status}`); continue; }
  const text = await res.text();
  lists[f] = [...new Set(text.split(/\r?\n/).map((s) => s.trim().toLowerCase()).filter((s) => s && !s.startsWith("#")))].sort();
  console.log(`${f}: ${lists[f].length} entries`);
}
const missing = langs.filter((l) => !MAP[l.code] || !lists[MAP[l.code]]).map((l) => l.code);
const out = {
  source: "LDNOOBW - List of Dirty, Naughty, Obscene, and Otherwise Bad Words",
  url: "https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words",
  license: "CC-BY-4.0",
  attribution: "Word lists by the LDNOOBW contributors, licensed CC BY 4.0. Entries were lower-cased and de-duplicated.",
  map: MAP,
  missing,
  lists,
};
writeFile(path.join(ROOT, "worker", "src", "wordlists.json"), JSON.stringify(out));
console.log(`written worker/src/wordlists.json; ${missing.length} locales have no list: ${missing.join(" ")}`);
