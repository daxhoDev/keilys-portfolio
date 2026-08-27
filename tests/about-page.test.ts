/**
 * The About page. Her biography is the longest and most personal thing on the site, so
 * these assertions are mostly about it arriving whole and in her order.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { es } from '../src/i18n/es.ts';
import { en } from '../src/i18n/en.ts';
import { SITE } from '../src/lib/site.ts';

const DIST = join(import.meta.dirname, '..', 'dist');
const raw = (route: string) =>
  readFileSync(join(DIST, `${route.replace(/^\//, '')}/index.html`), 'utf8');
const html = (route: string) =>
  raw(route)
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&');

const PAGES = [
  { route: '/sobre-mi', dict: es },
  { route: '/en/about', dict: en },
] as const;

before(() => assert.ok(existsSync(DIST), 'run `npm run build` first'));

describe('her biography', () => {
  for (const { route, dict } of PAGES) {
    test(`${route} renders all eight paragraphs, verbatim and in order`, () => {
      const page = html(route);
      let cursor = -1;

      for (const [index, paragraph] of dict.about.page.body.entries()) {
        const at = page.indexOf(paragraph);
        assert.ok(at > -1, `paragraph ${index + 1} is missing`);
        assert.ok(at > cursor, `paragraph ${index + 1} appears out of order`);
        cursor = at;
      }
    });

    test(`${route} opens with her lead`, () => {
      assert.ok(html(route).includes(dict.about.page.lead));
    });

    test(`${route} lists all five facts with their labels`, () => {
      const page = html(route);
      for (const fact of dict.about.page.facts) {
        assert.ok(page.includes(fact.label), `missing label: ${fact.label}`);
        assert.ok(page.includes(fact.value), `missing value: ${fact.value}`);
      }
    });
  }
});

describe('images', () => {
  test('both photographs are present with real alt text', () => {
    for (const { route, dict } of PAGES) {
      const page = html(route);
      assert.ok(page.includes(dict.about.portraitAlt), `${route}: portrait alt missing`);
      assert.ok(page.includes(dict.about.secondaryAlt), `${route}: secondary alt missing`);
    }
  });

  test('the portrait loads eagerly and the secondary lazily', () => {
    const page = raw('/sobre-mi');
    const images = [...page.matchAll(/<img[^>]+>/g)].map((m) => m[0]);
    const portrait = images.find((tag) => tag.includes('portrait'));
    const secondary = images.find((tag) => tag.includes('about-secondary'));

    assert.ok(portrait, 'no portrait image');
    assert.ok(secondary, 'no secondary image');
    assert.match(portrait, /loading="eager"/, 'the portrait is above the fold');
    assert.match(secondary, /loading="lazy"/);
  });

  test('no image requests a width larger than its source', () => {
    for (const { route } of PAGES) {
      for (const tag of [...raw(route).matchAll(/<img[^>]+>/g)].map((m) => m[0])) {
        const width = Number(tag.match(/\swidth="(\d+)"/)?.[1] ?? 0);
        const widths = [...(tag.match(/srcset="([^"]+)"/)?.[1] ?? '').matchAll(/(\d+)w/g)].map(
          (m) => Number(m[1]),
        );
        if (!width || !widths.length) continue;
        assert.deepEqual(
          widths.filter((w) => w > width),
          [],
          `${route}: upscaled srcset`,
        );
      }
    }
  });
});

describe('structure', () => {
  test('the closing band is inside the document, not after </html>', () => {
    // Content placed outside PageLayout renders after the closing tag: invalid, and a
    // browser still displays it, so it looks fine while being broken.
    for (const { route } of PAGES) {
      const page = raw(route);
      const band = page.indexOf('section-y-tight');
      assert.ok(band > -1, `${route}: no closing band`);
      assert.ok(band < page.indexOf('</html>'), `${route}: the band escaped the document`);
    }
  });

  test('the closing CTA points at the contact section on the homepage', () => {
    assert.match(raw('/sobre-mi'), /href="\/#contact"/);
    assert.match(raw('/en/about'), /href="\/en#contact"/);
  });

  test('the page declares AboutPage structured data linked to the Person', () => {
    for (const { route } of PAGES) {
      const data = JSON.parse(
        raw(route).match(/application\/ld\+json[^>]*>([\s\S]*?)<\/script>/)![1],
      );
      const about = data.find((node: Record<string, unknown>) => node['@type'] === 'AboutPage');
      assert.ok(about, `${route}: no AboutPage node`);
      assert.equal((about.mainEntity as Record<string, string>)['@id'], `${SITE.url}/#person`);
    }
  });

  test('the biography is revealed in pieces, so it does not appear as one slab', () => {
    const page = raw('/sobre-mi');
    const reveals = (page.match(/data-reveal/g) ?? []).length;
    assert.ok(reveals >= 8, `only ${reveals} reveal targets on a page of eight paragraphs`);
  });
});
