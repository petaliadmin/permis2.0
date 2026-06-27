// Generates PWA icons as valid PNGs without any image library.
// Draws a branded "P" mark on a green rounded square into a pixel buffer,
// then encodes PNG (zlib deflate) manually.
import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');
mkdirSync(PUBLIC, { recursive: true });

// Brand palette
const GREEN_DARK = [20, 83, 45]; // #14532d
const GREEN = [22, 163, 74]; // #16A34A
const GREEN_LITE = [34, 197, 94]; // #22c55e
const WHITE = [255, 255, 255];

function lerp(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

// Draw the icon into an RGBA buffer of size s x s.
// maskable=true => no rounded corners + extra padding so the safe zone is respected.
function drawIcon(s, { maskable = false } = {}) {
  const buf = Buffer.alloc(s * s * 4);
  const radius = maskable ? 0 : s * 0.22; // rounded square unless maskable
  const cornerR = radius;

  const inCorner = (x, y) => {
    // returns true if pixel is OUTSIDE the rounded rect (to make transparent)
    if (cornerR <= 0) return false;
    const cx = x < cornerR ? cornerR : x > s - cornerR ? s - cornerR : x;
    const cy = y < cornerR ? cornerR : y > s - cornerR ? s - cornerR : y;
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy > cornerR * cornerR;
  };

  // Glyph geometry: a bold "P" centered.
  const pad = maskable ? s * 0.30 : s * 0.24; // P bounding box padding
  const left = pad;
  const right = s - pad;
  const top = pad;
  const bottom = s - pad;
  const stemW = (right - left) * 0.30; // vertical stem width
  const bowlH = (bottom - top) * 0.52; // height of the P bowl
  const bowlOuterR = (bowlH) / 2;
  const bowlCx = left + stemW + (right - left - stemW) * 0.18;
  const bowlCy = top + bowlOuterR;
  const bowlInnerR = bowlOuterR * 0.46;

  const inP = (x, y) => {
    // stem
    if (x >= left && x <= left + stemW && y >= top && y <= bottom) return true;
    // bowl (ring): outer circle minus inner circle, right side
    const dx = x - bowlCx;
    const dy = y - bowlCy;
    const d2 = dx * dx + dy * dy;
    if (d2 <= bowlOuterR * bowlOuterR && d2 >= bowlInnerR * bowlInnerR) return true;
    return false;
  };

  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      if (inCorner(x, y)) {
        // transparent outside rounded corners
        buf[i] = buf[i + 1] = buf[i + 2] = buf[i + 3] = 0;
        continue;
      }
      // diagonal gradient background
      const t = (x + y) / (2 * s);
      let [r, g, b] =
        t < 0.5 ? lerp(GREEN_DARK, GREEN, t * 2) : lerp(GREEN, GREEN_LITE, (t - 0.5) * 2);
      if (inP(x, y)) [r, g, b] = WHITE;
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = 255;
    }
  }
  return buf;
}

// --- Minimal PNG encoder (truecolor + alpha, 8-bit) ---
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(rgba, s) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(s, 0);
  ihdr.writeUInt32BE(s, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  // raw with filter byte 0 per scanline
  const raw = Buffer.alloc((s * 4 + 1) * s);
  for (let y = 0; y < s; y++) {
    raw[y * (s * 4 + 1)] = 0;
    rgba.copy(raw, y * (s * 4 + 1) + 1, y * s * 4, (y + 1) * s * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function writePNG(name, size, opts) {
  const rgba = drawIcon(size, opts);
  writeFileSync(join(PUBLIC, name), encodePNG(rgba, size));
  console.log('wrote', name, size + 'x' + size);
}

writePNG('icon-192.png', 192, {});
writePNG('icon-512.png', 512, {});
writePNG('icon-maskable-192.png', 192, { maskable: true });
writePNG('icon-maskable-512.png', 512, { maskable: true });
writePNG('apple-touch-icon.png', 180, {});
writePNG('favicon-32.png', 32, {});

// SVG favicon (crisp at any size)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#14532d"/><stop offset="0.55" stop-color="#16A34A"/><stop offset="1" stop-color="#22c55e"/>
  </linearGradient></defs>
  <rect width="100" height="100" rx="22" fill="url(#g)"/>
  <path d="M34 24 h18 a16 16 0 0 1 0 32 h-9 v20 h-9 z M43 34 v12 h9 a6 6 0 0 0 0 -12 z" fill="#fff"/>
</svg>`;
writeFileSync(join(PUBLIC, 'favicon.svg'), svg);
console.log('wrote favicon.svg');
