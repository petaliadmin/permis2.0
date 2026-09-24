// Generates favicon/PWA icons from the brand illustration
// (public/logo permis 2.0.png), cropped to just the circular "driver" mark
// (the "Permis 2.0" wordmark banner below it is dropped — illegible at
// favicon sizes). Requires `sharp` (already a web app dependency).
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');
const SOURCE = join(PUBLIC, 'logo permis 2.0.png');

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
// Matches manifest.json's theme_color — used as the maskable icon background
// so Android's adaptive-icon mask crops onto a brand-consistent color.
const BRAND_BLUE = { r: 0, g: 62, b: 168, alpha: 1 };

/** The circular icon portion only, cropped from the full lockup (drops the
 *  wordmark banner below it). Computed once, reused for every size. */
async function iconCrop() {
  return sharp(SOURCE).trim().extract({ left: 0, top: 0, width: 1173, height: 660 }).toBuffer();
}

async function squareIcon(name, size, { background = WHITE, containScale = 0.92 } = {}) {
  const crop = await iconCrop();
  const inner = Math.round(size * containScale);
  const resized = await sharp(crop)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png({ palette: false })
    .toFile(join(PUBLIC, name));
  console.log('wrote', name, `${size}x${size}`);
}

await squareIcon('favicon-32.png', 32);
await squareIcon('apple-touch-icon.png', 180);
await squareIcon('icon-192.png', 192);
await squareIcon('icon-512.png', 512);
// Maskable: OS may crop up to ~20% from each edge, so the artwork stays
// within a generous safe zone (smaller containScale, brand-color background
// so the visible mask shape reads as intentional, not a random crop).
await squareIcon('icon-maskable-192.png', 192, { background: BRAND_BLUE, containScale: 0.65 });
await squareIcon('icon-maskable-512.png', 512, { background: BRAND_BLUE, containScale: 0.65 });

// SVG favicon wrapper — the artwork itself is a raster illustration (can't be
// meaningfully vectorized), so this embeds the same square PNG as a data URI
// behind the existing '/favicon.svg' + image/svg+xml reference in layout.tsx.
const svgSourcePng = await sharp(await iconCrop())
  .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
const b64 = svgSourcePng.toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="0" fill="#ffffff"/>
  <image href="data:image/png;base64,${b64}" width="128" height="128"/>
</svg>`;
writeFileSync(join(PUBLIC, 'favicon.svg'), svg);
console.log('wrote favicon.svg (embedded PNG)');

// Header lockup (icon + "Permis 2.0" wordmark) — used by SiteHeader/SchoolShell
// instead of the old inline "P" badge + text. Trimmed of transparent padding
// and downscaled from the 1254x1254 source so it stays a reasonable file size
// at the ~250px display width headers actually use.
await sharp(SOURCE)
  .trim()
  .resize({ width: 700 })
  // palette: false — Next.js's built-in image optimizer rejects indexed
  // (palette) PNGs ("requested resource isn't a valid image"); force
  // full truecolor+alpha output instead.
  .png({ palette: false })
  .toFile(join(PUBLIC, 'logo-header.png'));
console.log('wrote logo-header.png');
