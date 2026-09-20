// Tiny zero-dependency PNG writer + the Anemone flower icon (used for PWA icons).
import zlib from "node:zlib";

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
export function encodePng(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

/** Six-petal anemone on a blue square (full bleed so it is safe as a maskable icon). */
export function iconPng(size) {
  const bg = [10, 79, 189], fg = [255, 255, 255];
  const buf = Buffer.alloc(size * size * 4);
  const SS = 3;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let acc = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const px = ((x + (sx + 0.5) / SS) / size) * 2 - 1, py = ((y + (sy + 0.5) / SS) / size) * 2 - 1;
      let inside = false;
      for (let k = 0; k < 6 && !inside; k++) {
        const a = (k * Math.PI) / 3;
        const rx = px * Math.cos(a) + py * Math.sin(a), ry = -px * Math.sin(a) + py * Math.cos(a);
        const ex = rx / 0.17, ey = (ry + 0.36) / 0.34;
        if (ex * ex + ey * ey <= 1) inside = true;
      }
      if (px * px + py * py <= 0.12 * 0.12) inside = false;
      if (inside) acc++;
    }
    const t = acc / (SS * SS);
    const i = (y * size + x) * 4;
    for (let c = 0; c < 3; c++) buf[i + c] = Math.round(bg[c] * (1 - t) + fg[c] * t);
    buf[i + 3] = 255;
  }
  return encodePng(size, size, buf);
}

export const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0a4fbd"/><g fill="#fff"><ellipse cx="32" cy="15" rx="5.4" ry="10.9"/><ellipse cx="32" cy="15" rx="5.4" ry="10.9" transform="rotate(60 32 32)"/><ellipse cx="32" cy="15" rx="5.4" ry="10.9" transform="rotate(120 32 32)"/><ellipse cx="32" cy="15" rx="5.4" ry="10.9" transform="rotate(180 32 32)"/><ellipse cx="32" cy="15" rx="5.4" ry="10.9" transform="rotate(240 32 32)"/><ellipse cx="32" cy="15" rx="5.4" ry="10.9" transform="rotate(300 32 32)"/></g><circle cx="32" cy="32" r="3.8" fill="#0a4fbd"/></svg>
`;
