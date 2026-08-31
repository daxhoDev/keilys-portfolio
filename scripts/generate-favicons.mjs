/**
 * Builds the favicon set: a "K" in black on a light ground — Keily's decision, and
 * deliberately inverted from the site (specs/02-design-system.md § Brand mark).
 *
 * The glyph outline is extracted from the ACTUAL Playfair Display italic that the site
 * ships, rather than set as SVG text. Rasterising <text> would fall back to whatever
 * serif the build machine happens to have, so the mark would differ between machines
 * and would not match the wordmark. The path is baked into favicon.svg, so the icon
 * needs no font at all.
 *
 *   npm run favicons
 */
import { create } from 'fontkitten';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FONT = join(
  root,
  'node_modules/@fontsource/playfair-display/files/playfair-display-latin-400-italic.woff2',
);

const INK = '#000000';
const BONE = '#F2F1EF';
const SIZE = 512; // the master; everything else is scaled down from it
const PADDING = 0.24; // share of the canvas left clear — a disc crops the corners of the glyph box

function glyphPath() {
  const font = create(readFileSync(FONT));
  const glyph = font.glyphForCodePoint('K'.codePointAt(0));
  const bbox = glyph.path.bbox ?? glyph.path._bbox;

  return {
    d: glyph.path.toSVG(),
    minX: bbox.minX,
    minY: bbox.minY,
    width: bbox.maxX - bbox.minX,
    height: bbox.maxY - bbox.minY,
  };
}

/**
 * Optically centred rather than mathematically: the glyph is scaled on its tightest
 * axis and centred on its own bounding box, so the italic's lean does not push it
 * off-centre the way centring on the advance width would.
 */
function buildSvg({ d, minX, minY, width, height }) {
  const available = SIZE * (1 - PADDING * 2);
  const scale = available / Math.max(width, height);
  const x = (SIZE - width * scale) / 2 - minX * scale;
  const y = (SIZE + height * scale) / 2 + minY * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="${BONE}"/>
  <path transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)} ${-scale.toFixed(4)})" d="${d}" fill="${INK}"/>
</svg>
`;
}

const svg = buildSvg(glyphPath());

await mkdir(join(root, 'public'), { recursive: true });
await writeFile(join(root, 'public/favicon.svg'), svg, 'utf8');

await sharp(Buffer.from(svg), { density: 384 })
  .resize(96, 96)
  .png({ compressionLevel: 9 })
  .toFile(join(root, 'public/favicon-96.png'));
console.log('  + public/favicon-96.png  96×96  (round, transparent corners)');

/*
 * apple-touch-icon stays a full-bleed square. iOS masks it with its own squircle, so a
 * round icon with transparent corners lands as a circle floating on a black backdrop —
 * the platform rounds it, and doing it twice looks like a mistake.
 */
const squareSvg = svg.replace(
  /<circle[^>]*\/>/,
  `<rect width="${SIZE}" height="${SIZE}" fill="${BONE}"/>`,
);

await sharp(Buffer.from(squareSvg), { density: 384 })
  .resize(180, 180)
  .png({ compressionLevel: 9 })
  .toFile(join(root, 'public/apple-touch-icon.png'));
console.log('  + public/apple-touch-icon.png  180×180  (square — iOS applies its own mask)');

console.log('  + public/favicon.svg  (glyph baked as a path — no font needed)');
