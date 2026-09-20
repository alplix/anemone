// node scripts/check-contrast.mjs [--all]   measures every colour pair of every theme (WCAG 2 contrast ratio)
import { contrastReport } from "./lib/theme.mjs";

const rows = contrastReport();
const bad = rows.filter((r) => !r.ok);
if (process.argv.includes("--all")) for (const r of rows) console.log(`${r.ok ? "ok  " : "FAIL"} ${r.theme.padEnd(8)} ${r.pair.padEnd(40)} ${String(r.ratio).padStart(6)} (min ${r.min})`);
for (const r of bad) console.log(`FAIL ${r.theme.padEnd(8)} ${r.pair.padEnd(40)} ${r.ratio} < ${r.min}`);
console.log(`${rows.length} pairs checked, ${bad.length} below threshold`);
process.exit(bad.length ? 1 : 0);
