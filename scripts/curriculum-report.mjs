// node scripts/curriculum-report.mjs   writes notes/curriculum-v1.md from course.json + the Turkish/English titles
import path from "node:path";
import { ROOT, readJson, writeFile } from "./lib/util.mjs";

const course = readJson(path.join(ROOT, "content", "courses", "mass-communication-theories", "course.json"));
const tr = readJson(path.join(ROOT, "content", "i18n", "tr", "courses", "mass-communication-theories", "course.json"));
const en = readJson(path.join(ROOT, "content", "i18n", "en", "courses", "mass-communication-theories", "course.json"));
let n = 0, minutes = 0, ready = 0;
let md = `# Anemone: müfredat v1 (course.json'dan üretilir)\n\n_Bu dosya \`node scripts/curriculum-report.mjs\` ile üretilir; kaynak: \`content/courses/mass-communication-theories/course.json\`._\n\n`;
for (const [ui, u] of course.units.entries()) {
  md += `## Ünite ${ui + 1}: ${tr.units[u.id].title}  \n_${en.units[u.id].title}_ · renk ailesi: ${u.color}\n\n| # | ID | Ders | Önkoşul | dk | AUZEF | Durum |\n|---|---|---|---|---|---|---|\n`;
  for (const l of u.lessons) {
    n++; minutes += l.minutes; if (l.status === "ready") ready++;
    md += `| ${n} | \`${l.id}\` | ${tr.lessons[l.id].title} | ${(l.prereq || []).map((p) => `\`${p}\``).join(", ") || "–"} | ${l.minutes} | ${(l.auzef || []).join(", ") || "–"} | ${l.status === "ready" ? "hazır" : "planlı"} |\n`;
  }
  md += "\n";
}
md += `**Toplam:** ${course.units.length} ünite, ${n} ders, yaklaşık ${Math.round(minutes / 60)} saat; ${ready} ders yayında.\n\n`;
md += `AUZEF sütunu, AUZEF ders notunun (Polat, 2016) ünite numarasını gösterir (P1–P14); dolu olan dersler "AUZEF rotası"nı oluşturur.\n`;
writeFile(path.join(ROOT, "notes", "curriculum-v1.md"), md);
console.log(`notes/curriculum-v1.md: ${n} lessons, ~${Math.round(minutes / 60)} h, ${ready} ready`);
