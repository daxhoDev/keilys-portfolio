/**
 * The route map is the single source of truth for every URL on the site, so it is
 * tested exhaustively rather than by example: every page, every language, both
 * directions. See specs/03-information-architecture.md.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  LANGS,
  ROUTES,
  DEFAULT_LANG,
  path,
  getLangFromUrl,
  getPageKey,
  alternatePath,
  otherLang,
  type PageKey,
} from '../src/i18n/routes.ts';

const url = (pathname: string) => new URL(pathname, 'https://keilymargallery-sage.vercel.app');
const PAGE_KEYS = Object.keys(ROUTES) as PageKey[];

describe('language defaults', () => {
  test('Spanish is the default and comes first', () => {
    assert.equal(DEFAULT_LANG, 'es');
    assert.equal(LANGS[0], 'es');
  });

  test('Spanish lives at the root, English is prefixed', () => {
    assert.equal(ROUTES.home.es, '/');
    assert.equal(ROUTES.home.en, '/en');
  });

  test('English routes use English slugs, not the Spanish ones', () => {
    assert.equal(ROUTES.about.es, '/sobre-mi');
    assert.equal(ROUTES.about.en, '/en/about');
    assert.equal(ROUTES.work.es, '/mi-trabajo');
    assert.equal(ROUTES.work.en, '/en/my-work');
  });
});

describe('getLangFromUrl', () => {
  test('English only when the first segment is exactly "en"', () => {
    assert.equal(getLangFromUrl(url('/en')), 'en');
    assert.equal(getLangFromUrl(url('/en/about')), 'en');
    assert.equal(getLangFromUrl(url('/')), 'es');
    assert.equal(getLangFromUrl(url('/sobre-mi')), 'es');
  });

  test('a path that merely starts with the letters "en" is still Spanish', () => {
    assert.equal(getLangFromUrl(url('/english-lesson')), 'es');
    assert.equal(getLangFromUrl(url('/entrevista')), 'es');
  });
});

describe('getPageKey', () => {
  test('resolves every mapped route in both languages', () => {
    for (const key of PAGE_KEYS) {
      for (const lang of LANGS) {
        assert.equal(getPageKey(url(ROUTES[key][lang])), key, `${key}/${lang}`);
      }
    }
  });

  test('tolerates a trailing slash', () => {
    assert.equal(getPageKey(url('/mi-trabajo/')), 'work');
    assert.equal(getPageKey(url('/en/about/')), 'about');
  });

  test('returns null for an unmapped URL, which is what the 404 relies on', () => {
    assert.equal(getPageKey(url('/nope')), null);
    assert.equal(getPageKey(url('/en/nope')), null);
  });
});

describe('alternatePath', () => {
  test('lands on the equivalent page for every route, both directions', () => {
    for (const key of PAGE_KEYS) {
      for (const from of LANGS) {
        for (const to of LANGS) {
          assert.equal(
            alternatePath(url(ROUTES[key][from]), to),
            path(key, to),
            `${key} ${from}->${to}`,
          );
        }
      }
    }
  });

  test('round trips back to the original URL', () => {
    for (const key of PAGE_KEYS) {
      const there = alternatePath(url(ROUTES[key].es), 'en');
      assert.equal(alternatePath(url(there), 'es'), ROUTES[key].es);
    }
  });

  test('never lands on the homepage from a mapped page', () => {
    for (const key of PAGE_KEYS.filter((k) => k !== 'home')) {
      for (const to of LANGS) {
        assert.notEqual(alternatePath(url(ROUTES[key].es), to), path('home', to), key);
      }
    }
  });

  test('falls back to the homepage only when the URL has no page key', () => {
    assert.equal(alternatePath(url('/nope'), 'es'), '/');
    assert.equal(alternatePath(url('/nope'), 'en'), '/en');
  });
});

describe('otherLang', () => {
  test('is its own inverse', () => {
    for (const lang of LANGS) assert.equal(otherLang(otherLang(lang)), lang);
  });
});
