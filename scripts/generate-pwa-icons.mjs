/**
 * Generates the PWA icon set from an on-brand inline SVG using sharp
 * (already present as a Next.js dependency). Run with: `node scripts/generate-pwa-icons.mjs`
 *
 * Outputs:
 *   public/icons/icon-192.png            — standard
 *   public/icons/icon-512.png            — standard
 *   public/icons/icon-maskable-512.png   — full-bleed, safe-zone aware
 *   app/apple-icon.png                   — iOS home screen (Next serves as apple-touch-icon)
 *
 * Re-run this whenever the brand mark changes.
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The Just4Ag mark: green panel + lime two-leaf sprout.
 *  `inset` scales the mark down so maskable icons keep it inside the safe zone. */
function svg(size, { maskable = false } = {}) {
  const radius = maskable ? 0 : Math.round(size * 0.18);
  // Maskable safe zone is the centre 80%; shrink + centre the mark for it.
  const s = maskable ? 0.62 : 0.78;
  const off = (1 - s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2c4a1e"/>
      <stop offset="1" stop-color="#3d6b2a"/>
    </linearGradient>
    <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a8cc78"/>
      <stop offset="1" stop-color="#8fbc45"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${(radius / size) * 512}" fill="url(#bg)"/>
  <g transform="translate(${512 * off} ${512 * off}) scale(${s})">
    <path d="M256 392 C256 300 196 250 150 232 C150 304 196 360 256 392 Z" fill="url(#leaf)"/>
    <path d="M256 392 C256 300 316 250 362 232 C362 304 316 360 256 392 Z" fill="url(#leaf)"/>
    <path d="M256 408 C256 340 256 250 256 150" fill="none" stroke="#8fbc45" stroke-width="20" stroke-linecap="round"/>
    <circle cx="256" cy="150" r="30" fill="#a8cc78"/>
  </g>
</svg>`;
}

const targets = [
  { file: 'public/icons/icon-192.png', size: 192 },
  { file: 'public/icons/icon-512.png', size: 512 },
  { file: 'public/icons/icon-maskable-512.png', size: 512, maskable: true },
  { file: 'app/apple-icon.png', size: 180 },
];

await mkdir(join(root, 'public/icons'), { recursive: true });

for (const { file, size, maskable } of targets) {
  const png = await sharp(Buffer.from(svg(size, { maskable }))).png().toBuffer();
  await writeFile(join(root, file), png);
  console.log(`✓ ${file} (${size}x${size}${maskable ? ', maskable' : ''})`);
}

console.log('Done.');
