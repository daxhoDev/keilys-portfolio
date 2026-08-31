/**
 * Deletes emitted image originals that nothing references.
 *
 * Astro emits an asset for every imported image, whether or not the built pages point
 * at it. With `<Image>` the pages point at derivatives, so the originals sit in
 * dist/_astro as pure deploy weight — nobody downloads them, and every deploy carries
 * them anyway.
 *
 * Only raster originals are considered, and only when a scan of every emitted text
 * file finds no reference at all. Fonts, stylesheets, scripts and derivatives are
 * never touched.
 *
 *   npm run build   (runs this automatically)
 */
import { readdirSync, readFileSync, statSync, unlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(root, 'dist');
const ASSETS = join(DIST, '_astro');

/** Originals only. A derivative that nothing references would be a bug worth seeing. */
const ORIGINAL = /\.(jpe?g|png|gif|tiff?)$/i;
const TEXT = /\.(html|css|js|mjs|json|xml|txt|webmanifest)$/i;

function readAllText(dir) {
  let combined = '';
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) combined += readAllText(path);
    else if (TEXT.test(entry.name)) combined += readFileSync(path, 'utf8');
  }
  return combined;
}

export function findUnreferenced() {
  if (!existsSync(ASSETS)) return [];
  const haystack = readAllText(DIST);

  return readdirSync(ASSETS)
    .filter((file) => ORIGINAL.test(file))
    .filter((file) => !haystack.includes(file))
    .map((file) => ({ file, bytes: statSync(join(ASSETS, file)).size }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dead = findUnreferenced();

  if (dead.length === 0) {
    console.log('  assets: nothing unreferenced to prune');
  } else {
    let freed = 0;
    for (const { file, bytes } of dead) {
      unlinkSync(join(ASSETS, file));
      freed += bytes;
    }
    console.log(
      `  assets: pruned ${dead.length} unreferenced original${dead.length === 1 ? '' : 's'}, ` +
        `${(freed / 1024 / 1024).toFixed(1)}MB`,
    );
  }
}
