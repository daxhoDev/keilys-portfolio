/**
 * Assertions against the real built output in dist/.
 *
 * These exist because the interesting failures in this build are not logic errors —
 * they are things that compile, render, and are quietly wrong: a canonical URL with
 * a trailing slash, a page that lost its noindex, a Tailwind class that was never
 * emitted because it was constructed at runtime.
 *
 * Requires `npm run build` first; `npm test` does that.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { ROUTES, LANGS, type PageKey } from '../src/i18n/routes.ts';
import { SITE } from '../src/lib/site.ts';

const DIST = join(import.meta.dirname, '..', 'dist');

/** dist path for a route: / -> index.html, /sobre-mi -> sobre-mi/index.html */
const fileFor = (route: string) =>
  join(DIST, route === '/' ? 'index.html' : `${route.replace(/^\//, '')}/index.html`);

const html = (route: string) => readFileSync(fileFor(route), 'utf8');

const ALL_ROUTES = (Object.keys(ROUTES) as PageKey[]).flatMap((key) =>
  LANGS.map((lang) => ({ key, lang, route: ROUTES[key][lang] })),
);

before(() => {
  assert.ok(existsSync(DIST), 'dist/ is missing — run `npm run build` first');
});

describe('every route is emitted', () => {
  for (const { key, lang, route } of ALL_ROUTES) {
    test(`${key} (${lang}) -> ${route}`, () => {
      assert.ok(existsSync(fileFor(route)), `${fileFor(route)} was not built`);
    });
  }

  test('the 404 page is emitted', () => {
    assert.ok(existsSync(join(DIST, '404.html')));
  });
});

describe('canonical URLs', () => {
  for (const { route } of ALL_ROUTES) {
    test(`${route} is self-referencing and absolute`, () => {
      const canonical = html(route).match(/rel="canonical" href="([^"]+)"/)?.[1];
      assert.equal(canonical, `${SITE.url}${route === '/' ? '/' : route}`);
    });
  }

  test('no canonical carries a trailing slash, since trailingSlash is "never"', () => {
    for (const { route } of ALL_ROUTES) {
      if (route === '/') continue;
      const canonical = html(route).match(/rel="canonical" href="([^"]+)"/)?.[1] ?? '';
      assert.ok(!canonical.endsWith('/'), `${route} canonical ends with a slash`);
    }
  });
});

describe('hreflang', () => {
  for (const { key, lang, route } of ALL_ROUTES) {
    test(`${route} points at its equivalent page, not the homepage`, () => {
      const page = html(route);
      const es = page.match(/hreflang="es" href="([^"]+)"/)?.[1];
      const en = page.match(/hreflang="en" href="([^"]+)"/)?.[1];
      assert.equal(es, `${SITE.url}${ROUTES[key].es === '/' ? '/' : ROUTES[key].es}`);
      assert.equal(en, `${SITE.url}${ROUTES[key].en}`);
      assert.ok(lang === 'es' ? es : en, 'self-reference present');
    });
  }

  test('x-default points at Spanish on every page', () => {
    for (const { key, route } of ALL_ROUTES) {
      const xDefault = html(route).match(/hreflang="x-default" href="([^"]+)"/)?.[1];
      const spanish = ROUTES[key].es;
      assert.equal(xDefault, `${SITE.url}${spanish === '/' ? '/' : spanish}`, route);
    }
  });

  test('the 404 emits no alternate links, because it is not a per-locale page', () => {
    const page = readFileSync(join(DIST, '404.html'), 'utf8');
    assert.ok(!/<link[^>]+rel="alternate"/.test(page), '404 declares hreflang alternates');
    // The language switcher's own <a hreflang> links are expected here and are not
    // alternates — they tell a screen reader what language the link leads to.
    assert.match(page, /<a[^>]+hreflang=/, 'the switcher should still be present');
  });
});

describe('indexing', () => {
  test('every page is noindex while SITE.indexable is false', () => {
    assert.equal(SITE.indexable, false, 'still on the vercel.app URL');
    for (const { route } of ALL_ROUTES) {
      assert.match(html(route), /name="robots" content="noindex, nofollow"/, route);
    }
    assert.match(readFileSync(join(DIST, '404.html'), 'utf8'), /name="robots"/);
  });

  test('no sitemap is emitted while the site is not indexable', () => {
    assert.ok(!existsSync(join(DIST, 'sitemap-index.xml')), 'sitemap leaked into a noindex build');
  });
});

describe('language and document structure', () => {
  for (const { lang, route } of ALL_ROUTES) {
    test(`${route} declares lang="${lang}"`, () => {
      assert.match(html(route), new RegExp(`<html lang="${lang}"`));
    });
  }

  test('/ is the Spanish homepage, not a redirect to one', () => {
    const home = html('/');
    assert.ok(!home.includes('http-equiv="refresh"'), 'meta refresh redirect found');
    assert.ok(home.includes('Hola, soy Keily'), 'Spanish copy is not on /');
  });

  test('every page has a skip link pointing at the main landmark', () => {
    for (const { route } of ALL_ROUTES) {
      const page = html(route);
      assert.ok(page.includes('href="#main"'), `${route} has no skip link`);
      assert.ok(page.includes('id="main"'), `${route} has no #main target`);
    }
  });

  test('the 404 renders both languages, Spanish first', () => {
    const page = readFileSync(join(DIST, '404.html'), 'utf8');
    const sections = [...page.matchAll(/<section[^>]*lang="(es|en)"/g)].map((m) => m[1]);
    assert.deepEqual(sections, ['es', 'en']);
    assert.match(page, /<html lang="es"/);
  });
});

describe('titles and descriptions', () => {
  test('the home title is used verbatim, inner pages get the site-name suffix', () => {
    assert.match(html('/'), /<title>Keily Mar Couselo — Fotógrafa<\/title>/);
    assert.match(html('/en'), /<title>Keily Mar Couselo — Photographer<\/title>/);
    assert.match(html('/sobre-mi'), /<title>[^<]+ · Keily Mar Couselo<\/title>/);
    assert.match(html('/en/my-work'), /<title>[^<]+ · Keily Mar Couselo<\/title>/);
  });

  test('every page has a non-empty description', () => {
    for (const { route } of ALL_ROUTES) {
      const description = html(route).match(/name="description" content="([^"]*)"/)?.[1] ?? '';
      assert.ok(description.length > 100, `${route} description is ${description.length} chars`);
    }
  });
});

describe('structured data', () => {
  test('Person JSON-LD is valid and excludes the mailto: link from sameAs', () => {
    for (const { route } of ALL_ROUTES) {
      const raw = html(route).match(/application\/ld\+json[^>]*>([\s\S]*?)<\/script>/)?.[1];
      assert.ok(raw, `${route} has no JSON-LD`);
      const data = JSON.parse(raw);
      const person = Array.isArray(data) ? data.find((d) => d['@type'] === 'Person') : data;
      assert.equal(person.name, SITE.name);
      assert.ok(Array.isArray(person.sameAs));
      assert.ok(
        !person.sameAs.some((url: string) => url.startsWith('mailto:')),
        'email leaked into sameAs',
      );
      assert.equal(person.sameAs.length, 2, 'both Instagram accounts');
    }
  });

  test('jobTitle is localised', () => {
    const jobTitle = (route: string) =>
      JSON.parse(html(route).match(/application\/ld\+json[^>]*>([\s\S]*?)<\/script>/)![1]).jobTitle;
    assert.equal(jobTitle('/'), 'Fotógrafa');
    assert.equal(jobTitle('/en'), 'Photographer');
  });

  test('the About page adds AboutPage referencing the Person by @id', () => {
    const data = JSON.parse(
      html('/sobre-mi').match(/application\/ld\+json[^>]*>([\s\S]*?)<\/script>/)![1],
    );
    const aboutPage = data.find((d: Record<string, string>) => d['@type'] === 'AboutPage');
    assert.ok(aboutPage, 'no AboutPage node');
    assert.equal(aboutPage.mainEntity['@id'], `${SITE.url}/#person`);
  });
});

describe('CSS and fonts', () => {
  const css = () => {
    const file = readdirSync(join(DIST, '_astro')).find((f) => f.endsWith('.css'));
    return readFileSync(join(DIST, '_astro', file!), 'utf8');
  };

  test('every colour token is emitted as a custom property', () => {
    const sheet = css();
    for (const token of [
      'ink',
      'coal',
      'graphite',
      'iron',
      'steel',
      'mustang',
      'mustang-soft',
      'mustang-dim',
      'mist',
      'bone',
      'danger',
      'success',
    ]) {
      assert.match(sheet, new RegExp(`--color-${token}:`), `--color-${token} missing`);
    }
  });

  test('ink is pure black — the palette Keily asked for', () => {
    assert.match(css(), /--color-ink:\s*#000\b/);
  });

  test('font-display forces italic, since Playfair is only ever used in italic', () => {
    assert.match(css(), /\.font-display\{[^}]*font-style:italic/);
  });

  test('no upright Playfair face is shipped', () => {
    assert.ok(!/font-family:Playfair Display;font-style:normal/.test(css()));
  });

  test('woff2 files are emitted for both families', () => {
    const fonts = readdirSync(join(DIST, '_astro')).filter((f) => f.endsWith('.woff2'));
    assert.ok(fonts.length > 0, 'no fonts emitted');
  });
});
