/**
 * Builds public/og-default.jpg — the thumbnail every share of this site produces, on
 * WhatsApp, Instagram, Signal, Slack and anywhere else that reads Open Graph.
 *
 * Keily has not sent a dedicated one, and the spec permits a crop of a strong
 * photograph (specs/08-accessibility-seo-performance.md § Social cards). This crops the
 * hero — the image she chose as the face of the site — so a share looks like the site
 * rather than like a placeholder.
 *
 * It reads src/assets/hero.jpg, so replacing the hero regenerates the card. If she
 * sends a purpose-made image later, drop it in as public/og-default.jpg and delete
 * this script's entry from package.json.
 *
 *   npm run og
 */
import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(root, 'src/assets/hero.jpg');
const OUTPUT = join(root, 'public/og-default.jpg');

// The size every platform expects. Anything else gets re-cropped by them, badly.
const WIDTH = 1200;
const HEIGHT = 630;

const { width, height } = await sharp(SOURCE).metadata();

await sharp(SOURCE)
  .resize(WIDTH, HEIGHT, {
    fit: 'cover',
    // Centre, not `attention`: entropy-based cropping chases texture and would happily
    // cut the subject to keep a busy corner.
    position: 'centre',
  })
  .jpeg({ quality: 82, chromaSubsampling: '4:4:4', mozjpeg: true })
  .toFile(OUTPUT);

import { statSync } from 'node:fs';

console.log(`  + public/og-default.jpg  ${WIDTH}×${HEIGHT}  from a ${width}×${height} source`);
console.log(`    ${(statSync(OUTPUT).size / 1024).toFixed(0)}KB`);
