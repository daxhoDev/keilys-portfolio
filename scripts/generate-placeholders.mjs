/**
 * Deterministic grayscale placeholder generator.
 *
 * Offline, no network, stable output — the same manifest always produces the same
 * bytes, so builds are reproducible. Never overwrites a file that already exists,
 * which is what makes dropping in one of Keily's real photographs safe.
 *
 * Manifest per specs/04-content-model.md § Placeholder content.
 *
 *   npm run placeholders
 */

import { mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const PHOTOS = 'src/assets/photos';
const ASSETS = 'src/assets';
const PUBLIC = 'public';

/**
 * Two gallery entries are deliberately undersized (1100px and 1300px long edge)
 * so responsiveWidths() and the under-1400px build warning are exercised during
 * development rather than discovered when her real files arrive.
 */
const manifest = [
  // Standalone images
  { dir: ASSETS, name: 'hero.jpg', width: 2400, height: 1600 },
  { dir: ASSETS, name: 'portrait.jpg', width: 1200, height: 1500 },
  { dir: ASSETS, name: 'about-secondary.jpg', width: 1800, height: 1200 },
  { dir: PUBLIC, name: 'og-default.jpg', width: 1200, height: 630 },

  // Gallery: 9 portrait, 8 landscape, 3 square = 20
  { dir: PHOTOS, name: 'photo-01.jpg', width: 1600, height: 2000 },
  { dir: PHOTOS, name: 'photo-02.jpg', width: 2400, height: 1600 },
  { dir: PHOTOS, name: 'photo-03.jpg', width: 2000, height: 2000 },
  { dir: PHOTOS, name: 'photo-04.jpg', width: 1600, height: 2000 },
  { dir: PHOTOS, name: 'photo-05.jpg', width: 2400, height: 1600 },
  { dir: PHOTOS, name: 'photo-06.jpg', width: 1600, height: 2000 },
  { dir: PHOTOS, name: 'photo-07.jpg', width: 2400, height: 1600 },
  { dir: PHOTOS, name: 'photo-08.jpg', width: 2000, height: 2000 },
  { dir: PHOTOS, name: 'photo-09.jpg', width: 1600, height: 2000 },
  { dir: PHOTOS, name: 'photo-10.jpg', width: 2400, height: 1600 },
  { dir: PHOTOS, name: 'photo-11.jpg', width: 1600, height: 2000 },
  { dir: PHOTOS, name: 'photo-12.jpg', width: 2400, height: 1600 },
  { dir: PHOTOS, name: 'photo-13.jpg', width: 2000, height: 2000 },
  { dir: PHOTOS, name: 'photo-14.jpg', width: 1600, height: 2000 },
  { dir: PHOTOS, name: 'photo-15.jpg', width: 2400, height: 1600 },
  { dir: PHOTOS, name: 'photo-16.jpg', width: 1600, height: 2000 },
  { dir: PHOTOS, name: 'photo-17.jpg', width: 2400, height: 1600 },
  { dir: PHOTOS, name: 'photo-18.jpg', width: 1600, height: 2000 },
  { dir: PHOTOS, name: 'photo-19.jpg', width: 880, height: 1100, undersized: true },
  { dir: PHOTOS, name: 'photo-20.jpg', width: 1300, height: 867, undersized: true },
];

/** Deterministic mid-grey pair derived from the filename, so each file looks distinct. */
function tones(name) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)) % 997;
  const from = 18 + (hash % 26); // 18–43
  const to = 92 + (hash % 58); // 92–149
  return { from, to };
}

function gradientSvg({ width, height, name, undersized }) {
  const { from, to } = tones(name);
  const label = `${name} · ${width}×${height}${undersized ? ' · undersized' : ''}`;
  const fontSize = Math.round(Math.min(width, height) * 0.045);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
       <defs>
         <linearGradient id="g" x1="0" y1="1" x2="1" y2="0">
           <stop offset="0%" stop-color="rgb(${from},${from},${from})"/>
           <stop offset="100%" stop-color="rgb(${to},${to},${to})"/>
         </linearGradient>
       </defs>
       <rect width="${width}" height="${height}" fill="url(#g)"/>
       <text x="50%" y="50%" fill="rgba(255,255,255,0.72)" font-family="monospace"
             font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${label}</text>
     </svg>`,
  );
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

let written = 0;
let skipped = 0;

for (const entry of manifest) {
  const dir = join(root, entry.dir);
  const path = join(dir, entry.name);

  if (await exists(path)) {
    skipped += 1;
    continue;
  }

  await mkdir(dir, { recursive: true });
  await sharp(gradientSvg(entry))
    .grayscale()
    .jpeg({ quality: 85, chromaSubsampling: '4:4:4', mozjpeg: false })
    .toFile(path);

  written += 1;
  console.log(
    `  + ${entry.dir}/${entry.name}  ${entry.width}×${entry.height}${entry.undersized ? '  (undersized on purpose)' : ''}`,
  );
}

console.log(
  `\nplaceholders: ${written} written, ${skipped} left alone (${manifest.length} in manifest).` +
    (skipped ? '\n  Existing files are never overwritten — real photographs are safe.' : ''),
);
