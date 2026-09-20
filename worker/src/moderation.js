// Offensive-content filter for usernames, names, free text and group names. Mandatory on the server, offered in the
// browser as a convenience (src/assets/js/account.js imports the same normaliser through the generated bundle).
//
// Approach (not perfect, see README): normalise (case, accents, Turkish i/I/dotless i, leet-speak, separators between
// letters), then match against per-language lists:
//   - space-delimited languages: whole-word matches on tokens, plus a "spaced letters" join, plus substring matches
//     only for long (>= 5 letters) list entries and never inside allow-listed words (the Scunthorpe problem);
//   - languages without word spaces (Chinese, Japanese, Thai): substring matches, because there are no word breaks.
import WORDLISTS from "./wordlists.json" with { type: "json" };

const LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "!": "i", "|": "i", "€": "e", "£": "l" };
const FOLD = { "ı": "i", "İ": "i", "ß": "ss", "ł": "l", "Ł": "l", "ø": "o", "Ø": "o", "đ": "d", "Đ": "d", "æ": "ae", "œ": "oe", "þ": "th", "ð": "d" };
const NO_SPACE_RE = /[぀-ヿ㐀-鿿豈-﫿฀-๿가-힯]/;

// words that contain an offensive substring but are fine (extend as false positives are reported)
export const ALLOW = new Set(["scunthorpe", "assist", "assistant", "assess", "assume", "classic", "class", "glass", "grass", "pass", "passion", "bass", "mass", "massive", "analysis", "cocktail", "cockpit", "peacock", "hancock", "dickens", "essex", "sussex", "middlesex", "penistone", "shitake", "shiitake", "titan", "titles", "title", "tits", "therapist", "arsenal", "cumbria", "cucumber", "document", "buttress", "basement", "bassist", "amass", "harass", "embarrass", "compass", "sasha", "sikke", "amsterdam", "kasim", "kasım", "sikorski", "sikorsky", "sikkim", "amasya"]);

export function fold(s) {
  let out = "";
  for (const ch of String(s)) out += FOLD[ch] ?? ch;
  return out.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Lower-case, accent-fold and de-leet. Returns { tokens, joined, squashed } */
export function normalise(input) {
  const folded = fold(input);
  let de = "";
  for (const ch of folded) de += LEET[ch] ?? ch;
  const tokens = de.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return { folded, de, tokens, squashed: de.replace(/[^\p{L}\p{N}]+/gu, "") };
}

// compile lists once
const compiled = (() => {
  const words = new Set(), long = [], nospace = [];
  for (const [lang, list] of Object.entries(WORDLISTS.lists || {})) {
    for (const raw of list) {
      const w = normalise(raw).squashed;
      if (!w || w.length < 2) continue;
      if (NO_SPACE_RE.test(w)) { nospace.push(w); continue; }
      words.add(w);
      if (w.length >= 5) long.push(w);
    }
  }
  return { words, long: [...new Set(long)], nospace: [...new Set(nospace)] };
})();

/** true when the text should be rejected */
export function isOffensive(text) {
  if (!text || typeof text !== "string") return false;
  const n = normalise(text);
  // languages without spaces: substring match
  if (NO_SPACE_RE.test(n.de)) for (const w of compiled.nospace) if (n.squashed.includes(w)) return true;
  // whole-word tokens, and 2-3 adjacent tokens joined (multi-word entries such as "ball gag")
  for (let i = 0; i < n.tokens.length; i++) {
    let joined = "";
    for (let k = i; k < Math.min(n.tokens.length, i + 3); k++) {
      joined += n.tokens[k];
      if (compiled.words.has(joined) && !ALLOW.has(joined)) return true;
    }
  }
  // runs of single letters separated by separators: "f u c k"
  const runs = [...n.de.matchAll(/(?:^|[^\p{L}\p{N}])((?:\p{L}[^\p{L}\p{N}]){2,}\p{L})(?=$|[^\p{L}\p{N}])/gu)].map((m) => m[1].replace(/[^\p{L}\p{N}]+/gu, ""));
  for (const r of runs) if (compiled.words.has(r) && !ALLOW.has(r)) return true;
  // substring for long entries inside a single token, unless the token is an allowed word
  for (const t of n.tokens) {
    if (ALLOW.has(t) || t.length < 5) continue;
    for (const w of compiled.long) if (t.includes(w) && !isAllowedContaining(t, w)) return true;
  }
  return false;
}

function isAllowedContaining(token, bad) {
  for (const a of ALLOW) if (a.includes(bad) && token.includes(a)) return true;
  return false;
}

export const stats = () => ({ words: compiled.words.size, long: compiled.long.length, nospace: compiled.nospace.length, languages: Object.keys(WORDLISTS.lists || {}) });
