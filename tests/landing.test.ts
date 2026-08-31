/**
 * The landing page as emitted: hero, about preview, featured grid, contact shell.
 *
 * The image assertions here are the ones worth having. Astro will happily emit a
 * srcset wider than the source file, which produces duplicate variants and a srcset
 * that lies to the browser — and it looks fine in a screenshot.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { SITE } from '../src/lib/site.ts';
import { es } from '../src/i18n/es.ts';
import { en } from '../src/i18n/en.ts';

const DIST = join(import.meta.dirname, '..', 'dist');
const raw = (route: string) =>
  readFileSync(
    join(DIST, route === '/' ? 'index.html' : `${route.replace(/^\//, '')}/index.html`),
    'utf8',
  );

/** Astro escapes apostrophes and quotes in text nodes; copy is compared decoded. */
const html = (route: string) =>
  raw(route)
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&');

const LANDINGS = [
  { route: '/', dict: es },
  { route: '/en', dict: en },
] as const;

before(() => assert.ok(existsSync(DIST), 'run `npm run build` first'));

describe('hero', () => {
  for (const { route, dict } of LANDINGS) {
    test(`${route} fills the viewport height`, () => {
      const hero = html(route).match(/<section data-hero[^>]*>/)![0];
      // svh, not vh: vh is the LARGE viewport height, so mobile browser chrome
      // appearing on scroll would clip the section.
      assert.match(hero, /min-h-svh/, 'hero is not full viewport height');
      assert.ok(!/\bmin-h-screen\b/.test(hero), 'min-h-screen is 100vh and clips on mobile');
      assert.match(hero, /max-h-\[900px\]/, 'uncapped on tall monitors');
    });

    test(`${route} renders the veil that guarantees text contrast`, () => {
      // The measured proof lives in tests/hero-contrast.test.ts; this only checks the
      // element is actually on the page, since the veil is what carries legibility.
      assert.match(
        html(route),
        /<div class="hero-veil[^"]*"/,
        'the hero veil is required, not decoration',
      );
    });

    test(`${route} renders the headline in three masked segments`, () => {
      const page = html(route);
      for (const segment of dict.hero.headline) {
        assert.ok(page.includes(segment), `missing headline segment: ${segment}`);
      }
      const masks = page.match(/block overflow-hidden pb-\[0\.14em\]/g) ?? [];
      assert.equal(masks.length, 3, 'each segment needs its own mask for the line reveal');
    });

    test(`${route} carries the accent word and its underline`, () => {
      const page = html(route);
      assert.match(page, /text-mustang-soft/, 'accent word is not mustang-soft');
      assert.match(page, /data-hero-underline/, 'the rule that carries the emphasis is missing');
    });

    test(`${route} loads the hero image eagerly at high priority`, () => {
      const img = html(route).match(/<img[^>]+fetchpriority="high"[^>]*>/)?.[0];
      assert.ok(img, 'no high-priority image — the LCP element should be one');
      assert.match(img, /loading="eager"/);
    });
  }
});

describe('css', () => {
  test('min-h-svh really compiles to 100svh', () => {
    const sheet = readdirSync(join(DIST, '_astro')).find((f) => f.endsWith('.css'))!;
    const file = readFileSync(join(DIST, '_astro', sheet), 'utf8');
    assert.match(file, /\.min-h-svh\{min-height:100svh\}/);
  });
});

describe('featured work', () => {
  for (const { route } of LANDINGS) {
    test(`${route} shows exactly six photographs`, () => {
      const grid = html(route).match(/<ul[^>]*data-gallery[\s\S]*?<\/ul>/)![0];
      assert.equal((grid.match(/<figure[\s>]/g) ?? []).length, 6);
    });

    test(`${route} gives every photograph alt text in this language`, () => {
      const grid = html(route).match(/<ul[^>]*data-gallery[\s\S]*?<\/ul>/)![0];
      const alts = [...grid.matchAll(/alt="([^"]*)"/g)].map((m) => m[1]);
      assert.equal(alts.length, 6);
      for (const alt of alts) assert.ok(alt.trim().length > 10, `weak alt text: "${alt}"`);
    });

    test(`${route} loads the first row eagerly and the rest lazily`, () => {
      const grid = html(route).match(/<ul[^>]*data-gallery[\s\S]*?<\/ul>/)![0];
      assert.equal((grid.match(/loading="eager"/g) ?? []).length, 3);
      assert.equal((grid.match(/loading="lazy"/g) ?? []).length, 3);
    });
  }

  test('the two languages show the same six photographs in the same order', () => {
    const ids = (route: string) =>
      [...html(route).matchAll(/\/_astro\/(img-[^.]+)\./g)].map((m) => m[1]);
    assert.deepEqual(ids('/en'), ids('/'));
  });
});

describe('images never outrun their source', () => {
  for (const { route } of LANDINGS) {
    test(`${route}: no srcset entry is wider than the file itself`, () => {
      const page = html(route);
      let checked = 0;
      for (const match of page.matchAll(/<img[^>]+>/g)) {
        const tag = match[0];
        const width = Number(tag.match(/\swidth="(\d+)"/)?.[1] ?? 0);
        const widths = [...(tag.match(/srcset="([^"]+)"/)?.[1] ?? '').matchAll(/(\d+)w/g)].map(
          (m) => Number(m[1]),
        );
        if (!width || widths.length === 0) continue;
        checked += 1;
        const over = widths.filter((w) => w > width);
        assert.deepEqual(over, [], `an image requests ${over} from a ${width}px source`);
      }
      assert.ok(checked > 0, 'no responsive images found to check');
    });
  }
});

describe('about preview', () => {
  for (const { route, dict } of LANDINGS) {
    test(`${route} renders her short About text verbatim`, () => {
      const page = html(route);
      assert.ok(page.includes(dict.about.lead));
      for (const paragraph of dict.about.body) assert.ok(page.includes(paragraph));
    });
  }
});

describe('contact shell', () => {
  for (const { route, dict } of LANDINGS) {
    test(`${route} owns #contact and offers the mailto fallback`, () => {
      const page = html(route);
      assert.match(page, /id="contact"/);
      assert.ok(page.includes(`mailto:${SITE.email}`));
      assert.ok(page.includes(dict.contact.lead));
    });

    test(`${route} lists both Instagram accounts in the sidebar`, () => {
      const page = html(route);
      assert.ok(page.includes(dict.contact.socials.instagramGallery));
      assert.ok(page.includes(dict.contact.socials.instagramPersonal));
    });
  }

  test('the mailto is the contact path, since the form is hidden', () => {
    // The form is commented out until it has a backend (09-open-decisions.md §4), so
    // the address is now the ONLY way to reach her from this page.
    const page = html('/');
    assert.ok(!/<form/.test(page), 'a form that cannot deliver is on the page');
    assert.ok(page.includes(`mailto:${SITE.email}`), 'the section is a dead end');
  });
});
