// node scripts/ui-keys.mjs   lists every interface key used by code and compares with content/i18n/en/ui.json
import fs from "node:fs";
import path from "node:path";
import { ROOT, walkFiles, readJson, exists } from "./lib/util.mjs";

const files = [
  ...walkFiles(path.join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs")).map((f) => path.join(ROOT, "scripts", f)),
  ...walkFiles(path.join(ROOT, "src", "assets", "js")).map((f) => path.join(ROOT, "src", "assets", "js", f)),
];
const used = new Set();
const re = /\b(?:t|T|cx\.t|cx\.seg|seg)\(\s*(["'`])([a-z0-9.\-]+)\1/g;
for (const f of files) {
  const txt = fs.readFileSync(f, "utf8");
  for (const m of txt.matchAll(re)) used.add(m[2]);
  for (const m of txt.matchAll(/t\("([a-z0-9.-]+)"\)/g)) used.add(m[1]);
  for (const m of txt.matchAll(/\["((?:[a-z0-9-]+\.)+[a-z0-9-]+)"(?:,|\])/g)) used.add(m[1]);
}
// keys built dynamically
const dyn = [];
["context", "people-time", "claim", "concepts", "assumptions", "how-it-works", "evidence", "critique", "today", "turkey", "exam", "summary"].forEach((s) => dyn.push("section." + s));
["story", "text", "steps", "myth", "lab", "summary", "deep"].forEach((k) => dyn.push("kind." + k));
["study", "stats", "review", "exam", "settings", "account"].forEach((v) => { dyn.push(`app.${v}.title`, `app.${v}.desc`); });
for (let i = 0; i < 10; i++) dyn.push("rank." + i);
["first-card", "first-lesson", "sharp", "perfect-quiz", "streak-3", "streak-7", "streak-30", "hours-1", "hours-10", "deep-diver", "reviewer", "exam-first", "exam-80", "curious", "goal-getter"].forEach((b) => dyn.push(`badge.${b}.name`, `badge.${b}.desc`));
for (let i = 1; i <= 6; i++) dyn.push(`home.f${i}.t`, `home.f${i}.d`);
for (let i = 1; i <= 4; i++) dyn.push("account.point" + i);
["off", "on"].forEach((k) => dyn.push("common." + k));
["exam.kind-unit", "exam.kind-mock", "exam.kind-mistakes", "exam.h-date", "exam.h-kind", "exam.h-score", "exam.h-timed", "exam.h-topic", "exam.h-correct", "exam.h-total", "exam.h-rate"].forEach((k) => dyn.push(k));
["url.people", "url.glossary", "url.about", "url.privacy", "url.contact", "url.timeline"].forEach((k) => dyn.push(k));
dyn.forEach((k) => used.add(k));
for (const k of [...used]) if (k.endsWith(".") || k.startsWith(".") || !k.includes(".")) used.delete(k);

const enDir = path.join(ROOT, "content", "i18n", "en");
const en = {};
for (const f of fs.readdirSync(enDir).filter((x) => /^ui(.[a-z-]+)?.json$/.test(x))) Object.assign(en, readJson(path.join(enDir, f)));
const missing = [...used].filter((k) => !(k in en)).sort();
const unused = Object.keys(en).filter((k) => !used.has(k)).sort();
if (process.argv.includes("--list")) console.log([...used].sort().join("\n"));
console.log(`keys used: ${used.size}, in en/ui.json: ${Object.keys(en).length}`);
if (missing.length) console.log("MISSING in en/ui.json:\n  " + missing.join("\n  "));
if (unused.length) console.log("UNUSED in en/ui.json:\n  " + unused.join("\n  "));
process.exit(missing.length ? 1 : 0);
