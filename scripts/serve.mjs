// node scripts/serve.mjs [dir] [port]   tiny static server for local preview (serves 404.html for unknown paths)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { ROOT } from "./lib/util.mjs";

const dir = path.resolve(ROOT, process.argv[2] || ".preview");
const port = Number(process.argv[3] || 8123);
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".webmanifest": "application/manifest+json" };

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = path.join(dir, p);
  if (!file.startsWith(dir)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) {
    const nf = path.join(dir, "404.html");
    res.writeHead(404, { "Content-Type": TYPES[".html"] });
    return res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : "Not found");
  }
  const type = TYPES[path.extname(file)] || "application/octet-stream";
  const gz = /text|json|javascript|xml|svg/.test(type) && /gzip/.test(req.headers["accept-encoding"] || "");
  res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache", ...(gz ? { "Content-Encoding": "gzip", Vary: "Accept-Encoding" } : {}) });
  const stream = fs.createReadStream(file);
  (gz ? stream.pipe(zlib.createGzip({ level: 6 })) : stream).pipe(res);
}).listen(port, () => console.log(`serving ${path.relative(ROOT, dir) || "."} on http://localhost:${port}/`));
