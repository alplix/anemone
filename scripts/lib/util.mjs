// Shared helpers for the build and validation scripts. Zero dependencies.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
export const exists = (p) => fs.existsSync(p);
export const readText = (p) => fs.readFileSync(p, "utf8");

export function listFiles(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && (!ext || d.name.endsWith(ext)))
    .map((d) => d.name)
    .sort();
}

export function listDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
}

/** Write a file, creating folders; skip the write when identical (keeps git diffs and mtimes quiet). */
export function writeFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  if (fs.existsSync(p)) {
    const old = fs.readFileSync(p);
    const next = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
    if (old.equals(next)) return false;
  }
  fs.writeFileSync(p, content);
  return true;
}

export function rmDir(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

export function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else writeFile(d, fs.readFileSync(s));
  }
}

export function walkFiles(dir, base = dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkFiles(p, base));
    else out.push(path.relative(base, p).split(path.sep).join("/"));
  }
  return out.sort();
}

export const hash = (buf, len = 10) => crypto.createHash("sha1").update(buf).digest("hex").slice(0, len);

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

/** JSON for embedding inside <script type="application/json">: neutralise sequences that could end the script. */
export const jsonForScript = (obj) =>
  JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

const SPECIAL = { "ı": "i", "İ": "i", "ß": "ss", "ł": "l", "Ł": "l", "đ": "d", "Đ": "d", "ø": "o", "Ø": "o", "æ": "ae", "Æ": "ae", "œ": "oe", "Œ": "oe", "þ": "th", "Þ": "th", "ð": "d", "Ð": "d", "ħ": "h", "Ħ": "h" };

/** ASCII-fold a Latin-script string into a URL slug. */
export function slugAscii(str) {
  return String(str)
    .replace(/[ıİßłŁđĐøØæÆœŒþÞðÐħĦ]/g, (c) => SPECIAL[c])
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Plain text of a Markdown-lite string (refs become their label, markup removed). */
export function plainText(md) {
  return String(md ?? "")
    .replace(/\[\[(?:person|concept|lesson):[^|\]]+\|([^\]]+)\]\]/g, "$1")
    .replace(/\[\[(?:person|concept|lesson):([^\]|]+)\]\]/g, "$1")
    .replace(/\[\[cite:[^\]]+\]\]/g, "")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^\s*(?:[-*]|\d+\.)\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const words = (s) => (String(s).match(/[\p{L}\p{N}]+/gu) || []).length;

/** Small, safe CSS minification: strip comments and collapse whitespace (no selector or value rewriting). */
export function minCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?([{};,]) ?/g, "$1")
    .replace(/\n+/g, "\n");
}

export function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
