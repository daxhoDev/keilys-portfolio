/**
 * Budgets, favicons and robots.txt — the Phase 8 outputs that can be verified without
 * a browser.
 *
 * A budget nobody measures is a wish. The font payload sat at 320KB against a 120KB
 * limit from Phase 1 until Phase 8, because importing a Fontsource package silently
 * ships every subset it has, and nothing looked wrong.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { BUDGETS } from '../scripts/check-budgets.mjs';
import { SITE } from '../src/lib/site.ts';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');

before(() => assert.ok(existsSync(DIST), 'run `npm run build` first'));

describe('performance budgets', () => {
  for (const { name, measure, limit } of BUDGETS) {
    test(`${name} is within budget`, () => {
      const actual = measure();
      assert.ok(
        actual <= limit,
        `${name}: ${(actual / 1024).toFixed(1)}KB exceeds ${(limit / 1024).toFixed(0)}KB`,
      );
    });
  }
});

describe('fonts ship only what the site uses', () => {
  const faces = () => readdirSync(join(DIST, '_astro')).filter((f) => f.endsWith('.woff2'));

  test('no subset beyond latin is shipped', () => {
    // Spanish lives entirely inside U+0000–00FF. Cyrillic, Greek and Vietnamese were
    // being shipped by an import of the whole package.
    for (const face of faces()) {
      for (const subset of ['cyrillic', 'greek', 'vietnamese', 'latin-ext']) {
        assert.ok(!face.includes(subset), `${face} is a subset this site never renders`);
      }
    }
  });

  test('only italic Playfair, and only the two weights in the type scale', () => {
    const playfair = faces().filter((f) => f.includes('playfair'));
    assert.equal(playfair.length, 2, `expected 400 and 500 italic, got ${playfair.join(', ')}`);
    for (const face of playfair) assert.match(face, /italic/, `${face} is not italic`);
  });

  test('the declared faces match the files, so nothing 404s at runtime', () => {
    const sheet = readdirSync(join(DIST, '_astro')).find((f) => f.endsWith('.css'))!;
    const css = readFileSync(join(DIST, '_astro', sheet), 'utf8');
    const referenced = [...css.matchAll(/url\(([^)]*\.woff2)\)/g)].map((m) =>
      m[1].replace(/^["']|["']$/g, '').replace('/_astro/', ''),
    );

    assert.ok(referenced.length > 0, 'no font files are referenced at all');
    for (const file of referenced) {
      assert.ok(existsSync(join(DIST, '_astro', file)), `${file} is referenced but not emitted`);
    }
  });
});

describe('favicons', () => {
  const files = ['favicon.svg', 'favicon-96.png', 'apple-touch-icon.png'];

  test('all three exist and are non-empty', () => {
    for (const file of files) {
      const path = join(DIST, file);
      assert.ok(existsSync(path), `${file} is missing`);
      assert.ok(statSync(path).size > 200, `${file} is suspiciously small`);
    }
  });

  test('every icon the head links to is actually emitted', () => {
    const head = readFileSync(join(DIST, 'index.html'), 'utf8');
    for (const [, href] of head.matchAll(/rel="(?:icon|apple-touch-icon)"[^>]*href="([^"]+)"/g)) {
      assert.ok(existsSync(join(DIST, href.replace(/^\//, ''))), `${href} is linked but missing`);
    }
  });

  test('the SVG carries the glyph as a path, so it needs no font', () => {
    const svg = readFileSync(join(DIST, 'favicon.svg'), 'utf8');
    assert.match(svg, /<path/, 'the mark is not an outline');
    assert.ok(!/<text/.test(svg), 'text would render in whatever serif the viewer has');
  });

  test('it is Keily’s inversion: black mark on a light ground', () => {
    const svg = readFileSync(join(DIST, 'favicon.svg'), 'utf8');
    assert.match(svg, /fill="#F2F1EF"/, 'the ground is not bone');
    assert.match(svg, /fill="#000000"/, 'the mark is not black');
  });
});

describe('robots.txt', () => {
  const robots = () => readFileSync(join(DIST, 'robots.txt'), 'utf8');

  test('is emitted', () => {
    assert.ok(existsSync(join(DIST, 'robots.txt')));
  });

  test('agrees with SITE.indexable rather than being written by hand', () => {
    if (SITE.indexable) {
      assert.match(robots(), /Allow: \//);
      assert.match(robots(), /Sitemap:/);
    } else {
      assert.match(robots(), /Disallow: \//);
      assert.ok(!/^Sitemap:/m.test(robots()), 'a sitemap is advertised on a closed site');
    }
  });

  test('the three indexing switches move together', () => {
    // robots.txt, the meta tag and the sitemap must never disagree.
    const home = readFileSync(join(DIST, 'index.html'), 'utf8');
    const hasNoindex = /name="robots" content="noindex/.test(home);
    const hasSitemap = existsSync(join(DIST, 'sitemap-index.xml'));
    const disallowed = /Disallow: \//.test(robots());

    assert.equal(hasNoindex, disallowed, 'meta robots and robots.txt disagree');
    assert.equal(hasSitemap, !disallowed, 'the sitemap disagrees with robots.txt');
  });
});
