/**
 * Static assertions on the chrome as it is emitted.
 *
 * This is the half of Phase 3 that can be checked without a browser. Focus trapping,
 * Esc, focus return, scroll lock and inert are behaviour, not markup — they live in
 * tests/browser/menu.spec.ts and are not covered here. Do not read a pass from this
 * file as "the mobile menu is accessible".
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { ROUTES, LANGS, type PageKey } from '../src/i18n/routes.ts';
import { SITE } from '../src/lib/site.ts';
import { es } from '../src/i18n/es.ts';
import { en } from '../src/i18n/en.ts';

const DIST = join(import.meta.dirname, '..', 'dist');
const fileFor = (route: string) =>
  join(DIST, route === '/' ? 'index.html' : `${route.replace(/^\//, '')}/index.html`);
const html = (route: string) => readFileSync(fileFor(route), 'utf8');

const ALL_ROUTES = (Object.keys(ROUTES) as PageKey[]).flatMap((key) =>
  LANGS.map((lang) => ({ key, lang, route: ROUTES[key][lang] })),
);

before(() => assert.ok(existsSync(DIST), 'run `npm run build` first'));

describe('chrome is on every page', () => {
  for (const { route } of ALL_ROUTES) {
    test(`${route} has header, footer and mobile menu`, () => {
      const page = html(route);
      assert.match(page, /data-header/, 'no header');
      assert.match(page, /<footer/, 'no footer');
      assert.match(page, /data-mobile-menu/, 'no mobile menu');
    });
  }

  test('the 404 has the chrome too', () => {
    const page = readFileSync(join(DIST, '404.html'), 'utf8');
    assert.match(page, /data-header/);
    assert.match(page, /<footer/);
  });
});

describe('header', () => {
  test('only the landing page gets the transparent header', () => {
    // Match the header tag itself: the string also appears inside the inlined
    // scroll-header script on every page, which is not the same thing at all.
    const headerTag = (route: string) => html(route).match(/<header[^>]*>/)![0];
    assert.match(headerTag('/'), /data-transparent/);
    assert.match(headerTag('/en'), /data-transparent/);
    assert.ok(!headerTag('/sobre-mi').includes('data-transparent'));
    assert.ok(!headerTag('/en/my-work').includes('data-transparent'));
  });

  test('the wordmark is the short form, and the full name is used elsewhere', () => {
    assert.ok(html('/').includes(SITE.wordmark));
    assert.equal(SITE.wordmark, 'Keily Mar');
    assert.match(html('/'), /Keily Mar Couselo/, 'full name should still appear (footer, meta)');
  });

  test('the menu button is wired to the menu it controls', () => {
    const page = html('/');
    const controls = page.match(/aria-controls="([^"]+)"/)?.[1];
    assert.ok(controls, 'menu button has no aria-controls');
    assert.match(page, new RegExp(`id="${controls}"`), 'aria-controls points at nothing');
    assert.match(page, /aria-expanded="false"/, 'menu button starts collapsed');
  });

  test('the closed menu is hidden, so its links are not tabbable from the page', () => {
    assert.match(html('/'), /data-mobile-menu[^>]*\shidden/);
  });
});

describe('navigation state', () => {
  // Nav renders three times per page (header, mobile menu, footer), so an inner page
  // marks its own link exactly three times: once per nav, never twice within one.
  const NAV_INSTANCES = 3;

  for (const { key, route } of ALL_ROUTES) {
    test(`${route} marks the current page in every nav, and only there`, () => {
      const marks = (html(route).match(/aria-current="page"/g) ?? []).length;
      assert.equal(
        marks,
        key === 'home' ? 0 : NAV_INSTANCES,
        key === 'home'
          ? 'the landing page has no nav link of its own — the wordmark covers it'
          : `expected one marker per nav`,
      );
    });
  }

  test('contact links to the in-page anchor on home and to the homepage anchor elsewhere', () => {
    assert.match(html('/'), /href="#contact"/);
    assert.match(html('/sobre-mi'), /href="\/#contact"/);
    assert.match(html('/en/about'), /href="\/en#contact"/);
  });
});

describe('language switcher', () => {
  test('the active language is not a link on any page', () => {
    for (const { lang, route } of ALL_ROUTES) {
      const page = html(route);
      const active = lang === 'es' ? es.lang.es : en.lang.en;
      assert.match(page, new RegExp(`aria-current="true"[^>]*>\\s*${active}`), route);
    }
  });

  test('the switcher is a labelled group rather than a third landmark', () => {
    assert.match(html('/'), /role="group" aria-label="Cambiar idioma"/);
  });

  test('the switcher link carries lang and hreflang for the target language', () => {
    assert.match(html('/'), /hreflang="en"[^>]*lang="en"/);
    assert.match(html('/en'), /hreflang="es"[^>]*lang="es"/);
  });
});

describe('footer', () => {
  test('lists both Instagram accounts, work first, with distinct labels', () => {
    const page = html('/');
    const gallery = page.indexOf('instagram.com/kyliemargallery');
    const personal = page.indexOf('instagram.com/_kyliemar_');
    assert.ok(gallery > -1 && personal > -1, 'an Instagram account is missing');
    assert.ok(gallery < personal, 'the work account must come first');
    assert.ok(page.includes(es.contact.socials.instagramGallery));
    assert.ok(page.includes(es.contact.socials.instagramPersonal));
    assert.notEqual(es.contact.socials.instagramGallery, es.contact.socials.instagramPersonal);
  });

  test('external links carry rel="me noopener"', () => {
    assert.match(html('/'), /instagram[^>]*rel="me noopener"|rel="me noopener"[^>]*instagram/);
  });

  test('the email is a plain visible mailto with no obfuscation', () => {
    const page = html('/');
    assert.ok(page.includes(`mailto:${SITE.email}`), 'no mailto link');
    assert.ok(page.includes(SITE.email), 'the address itself is not in the HTML');
  });

  test('the copyright year is the build year', () => {
    assert.ok(html('/').includes(String(new Date().getFullYear())));
  });
});

describe('landmarks', () => {
  test('there is exactly one main landmark per page', () => {
    for (const { route } of ALL_ROUTES) {
      assert.equal((html(route).match(/<main[\s>]/g) ?? []).length, 1, route);
    }
  });

  test('the fixed header does not overlap content on pages without a hero', () => {
    assert.match(html('/sobre-mi'), /<main id="main" class="[^"]*pt-18/);
    // The landing page opts out deliberately: the hero sits under the transparent header.
    assert.ok(!/<main id="main" class="[^"]*pt-18/.test(html('/')));
  });
});

describe('the header must not be persisted across navigations', () => {
  /**
   * Regression. specs/06-components.md originally asked for transition:persist on the
   * header. Persist keeps the *old* DOM element across a client-side navigation, and
   * this header carries per-page state: aria-current, and the language switcher hrefs
   * from alternatePath(Astro.url). With persist on, both froze at whatever the first
   * page rendered — the switcher kept pointing at the previous page's counterpart and
   * no nav item was ever marked current.
   */
  test('no element in the header is marked transition:persist', () => {
    for (const { route } of ALL_ROUTES) {
      const header = html(route).match(/<header[\s\S]*?<\/header>/)?.[0] ?? '';
      assert.ok(
        !header.includes('data-astro-transition-persist'),
        `${route}: the header is persisted, so its nav and switcher state cannot update`,
      );
    }
  });

  test('the switcher points at this page’s counterpart, not a fixed URL', () => {
    const switcherTarget = (route: string) => {
      const header = html(route).match(/<header[\s\S]*?<\/header>/)![0];
      const group = header.match(/role="group"[\s\S]*?<\/div>/)![0];
      return group.match(/href="([^"]+)"/)?.[1];
    };

    assert.equal(switcherTarget('/'), '/en');
    assert.equal(switcherTarget('/sobre-mi'), '/en/about');
    assert.equal(switcherTarget('/mi-trabajo'), '/en/my-work');
    assert.equal(switcherTarget('/en/about'), '/sobre-mi');
    assert.equal(switcherTarget('/en/my-work'), '/mi-trabajo');

    // Every route resolves to a distinct target — a frozen switcher would repeat one.
    const targets = ALL_ROUTES.map(({ route }) => switcherTarget(route));
    assert.equal(new Set(targets).size, targets.length, 'two routes share a switcher target');
  });

  test('header and footer share one transition scope across every page', () => {
    // transition:name is what replaces persist: it pairs the old and new element so
    // they morph rather than cross-fade. Pairing only happens if the scope matches,
    // so a per-page scope would silently reintroduce the flash persist was hiding.
    const scope = (route: string, tag: 'header' | 'footer') =>
      html(route).match(new RegExp(`<${tag}[^>]*data-astro-transition-scope="([^"]+)"`))?.[1];

    for (const tag of ['header', 'footer'] as const) {
      const scopes = ALL_ROUTES.map(({ route }) => scope(route, tag));
      assert.ok(scopes[0], `no transition scope on the ${tag}`);
      assert.equal(new Set(scopes).size, 1, `the ${tag} scope differs between pages`);
    }
  });

  test('the current-page marker names this page, not another one', () => {
    const currentLabel = (route: string) =>
      html(route)
        .match(/<header[\s\S]*?<\/header>/)![0]
        .match(/aria-current="page"[^>]*>\s*([^<]+)/)?.[1]
        .trim();

    assert.equal(currentLabel('/sobre-mi'), 'Sobre mí');
    assert.equal(currentLabel('/mi-trabajo'), 'Mi trabajo');
    assert.equal(currentLabel('/en/about'), 'About');
    assert.equal(currentLabel('/en/my-work'), 'My work');
  });
});

describe('dark chrome while the header sits over the hero', () => {
  /**
   * The hero is a bright photograph, so light chrome disappears into it. The header
   * switches to dark ink while it is over the image and back to light once it scrolls
   * onto its own coal background.
   */
  test('the landing header is in the dark state on first paint, before any script runs', () => {
    for (const route of ['/', '/en']) {
      const tag = html(route).match(/<header[^>]*>/)![0];
      assert.match(tag, /data-over-hero/, `${route}: dark state is not server-rendered`);
      assert.match(tag, /class="[^"]*\bgroup\b/, 'children read the state through group-data-*');
    }
  });

  test('pages without a hero never get the dark state', () => {
    for (const route of ['/sobre-mi', '/mi-trabajo', '/en/about', '/en/my-work']) {
      const tag = html(route).match(/<header[^>]*>/)![0];
      assert.ok(!tag.includes('data-over-hero'), `${route}: dark chrome over a coal header`);
    }
  });

  test('the wordmark, nav links and switcher all carry the dark variant', () => {
    const header = html('/').match(/<header[\s\S]*?<\/header>/)![0];
    for (const fragment of [
      'group-data-[over-hero]:text-ink', // wordmark and current nav link
      'group-data-[over-hero]:text-ink/80', // inactive nav links
      'group-data-[over-hero]:text-ink/70', // the switcher's link
    ]) {
      assert.ok(header.includes(fragment), `no dark treatment: ${fragment}`);
    }
  });

  test('the dark variants are actually emitted as CSS, not just written in the markup', () => {
    const sheet = readdirSync(join(DIST, '_astro')).find((f: string) => f.endsWith('.css'))!;
    const css = readFileSync(join(DIST, '_astro', sheet), 'utf8');
    assert.match(css, /\[data-over-hero\]/, 'the group-data variant produced no rules');
  });

  test('the footer is untouched — it never sits over the photograph', () => {
    const footer = html('/').match(/<footer[\s\S]*?<\/footer>/)![0];
    assert.ok(!footer.includes('over-hero'), 'dark chrome leaked into the footer');
  });
});
