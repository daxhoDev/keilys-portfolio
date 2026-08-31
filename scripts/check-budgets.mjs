/**
 * Measures the performance budgets from specs/08-accessibility-seo-performance.md
 * against the real build, and fails if any is exceeded.
 *
 * Budgets are only meaningful if something checks them: the font payload was 320KB
 * against a 120KB limit for weeks, because importing a Fontsource package quietly
 * ships every subset it has.
 *
 *   npm run check:budgets   (requires npm run build first)
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(root, 'dist');
const ASTRO = join(DIST, '_astro');

const kb = (bytes) => `${(bytes / 1024).toFixed(1)}KB`;
const gzipped = (file) => gzipSync(readFileSync(file)).length;

const pageFile = (route) =>
  join(DIST, route === '/' ? 'index.html' : `${route.replace(/^\//, '')}/index.html`);

/** Everything a page executes: its inline module scripts plus the bundles it links. */
export function pageJs(route) {
  const html = readFileSync(pageFile(route), 'utf8');

  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])
    .filter((source) => !source.includes('application/ld+json'))
    .join('\n');

  let total = gzipSync(Buffer.from(inline)).length;

  const seen = new Set();
  for (const [, src] of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
    const file = join(DIST, src.replace(/^\//, ''));
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);
    total += gzipped(file);
  }

  return total;
}

export function cssBytes() {
  return readdirSync(ASTRO)
    .filter((f) => f.endsWith('.css'))
    .reduce((sum, f) => sum + gzipped(join(ASTRO, f)), 0);
}

export function fontBytes() {
  // Fonts are already compressed; gzipping them again measures nothing real.
  return readdirSync(ASTRO)
    .filter((f) => f.endsWith('.woff2'))
    .reduce((sum, f) => sum + statSync(join(ASTRO, f)).size, 0);
}

export const BUDGETS = [
  { name: 'JS on / (gzip)', measure: () => pageJs('/'), limit: 30 * 1024 },
  { name: 'JS on /sobre-mi (gzip)', measure: () => pageJs('/sobre-mi'), limit: 12 * 1024 },
  { name: 'JS on /mi-trabajo (gzip)', measure: () => pageJs('/mi-trabajo'), limit: 30 * 1024 },
  { name: 'CSS, whole site (gzip)', measure: cssBytes, limit: 20 * 1024 },
  { name: 'Fonts, all faces', measure: fontBytes, limit: 120 * 1024 },
];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!existsSync(DIST)) {
    console.error('dist/ is missing — run `npm run build` first.');
    process.exit(1);
  }

  console.log('\nPerformance budgets\n');
  let failed = 0;

  for (const { name, measure, limit } of BUDGETS) {
    const actual = measure();
    const ok = actual <= limit;
    if (!ok) failed += 1;
    const headroom = (((limit - actual) / limit) * 100).toFixed(0);
    console.log(
      `  ${ok ? 'ok  ' : 'OVER'} ${name.padEnd(26)} ${kb(actual).padStart(8)} / ${kb(limit).padStart(8)}` +
        `   ${ok ? `${headroom}% headroom` : `over by ${kb(actual - limit)}`}`,
    );
  }

  console.log(failed ? `\n${failed} budget(s) exceeded.\n` : '\nEvery budget met.\n');
  process.exit(failed ? 1 : 0);
}
