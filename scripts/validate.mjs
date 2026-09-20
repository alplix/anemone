// node scripts/validate.mjs [--strict]   validates everything under content/
import { loadModel } from "./lib/content.mjs";

const strict = process.argv.includes("--strict");
const model = loadModel();
const { errors, warnings } = model.report;

const course = Object.values(model.courses)[0];
const ready = course ? course.lessons.filter((l) => l.status === "ready").length : 0;
console.log(`languages: ${model.languages.length} (published: ${model.publishedLangs.map((l) => l.code).join(", ")})`);
console.log(`courses: ${Object.keys(model.courses).join(", ")} | lessons: ${course?.lessons.length} (ready: ${ready}) | people: ${Object.keys(model.people).length} | concepts: ${Object.keys(model.concepts).length} | bibliography: ${Object.keys(model.bib).length}`);
for (const w of warnings) console.log("  warn  " + w);
for (const e of errors) console.log("  ERROR " + e);
console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length || (strict && warnings.length) ? 1 : 0);
