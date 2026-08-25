/**
 * Phase 5: the gallery, the tone filters and the lightbox.
 *
 * The behavioural half of the lightbox — focus trap, focus return, Esc, arrows, swipe,
 * inert, the live region firing — lives in tests/browser/lightbox.spec.ts and has never
 * run in this environment. What is asserted here is everything observable in the built
 * HTML: the semantics a screen reader reads, the counts, and the image work.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { shouldShowToneFilters, parseToneFilter, TONE_FILTERS } from '../src/lib/tone-filter.ts';
import { es } from '../src/i18n/es.ts';
import { en } from '../src/i18n/en.ts';

const DIST = join(import.meta.dirname, '..', 'dist');
/** Astro escapes &, quotes and apostrophes in text nodes; copy is compared decoded. */
const html = (route: string) =>
  readFileSync(
    join(DIST, route === '/' ? 'index.html' : `${route.replace(/^\//, '')}/index.html`),
    'utf8',
  )
    .replaceAll('&#38;', '&')
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"');

const WORK = [
  { route: '/mi-trabajo', dict: es },
  { route: '/en/my-work', dict: en },
] as const;

before(() => assert.ok(existsSync(DIST), 'run `npm run build` first'));

describe('filter-row rules', () => {
  test('the row is shown only when both tones have photographs', () => {
    assert.equal(shouldShowToneFilters({ bw: 17, colour: 10 }), true);
    assert.equal(shouldShowToneFilters({ bw: 27, colour: 0 }), false, 'all black and white');
    assert.equal(shouldShowToneFilters({ bw: 0, colour: 27 }), false, 'all colour');
    assert.equal(shouldShowToneFilters({ bw: 0, colour: 0 }), false, 'no photographs at all');
  });

  test('an unknown ?filter= falls back to showing everything', () => {
    for (const valid of TONE_FILTERS) assert.equal(parseToneFilter(valid), valid);
    for (const junk of ['sepia', '', 'BW', '../etc', null, undefined]) {
      assert.equal(parseToneFilter(junk), 'all', `${junk} should fall back`);
    }
  });
});

describe('the gallery page', () => {
  for (const { route, dict } of WORK) {
    test(`${route} renders every non-draft photograph`, () => {
      const page = html(route);
      const cards = (page.match(/data-photo /g) ?? []).length;
      assert.equal(cards, 27, 'expected all 27 of her photographs');
    });

    test(`${route} gives every card a tone and an index`, () => {
      const page = html(route);
      const tones = [...page.matchAll(/data-tone="([^"]+)"/g)].map((m) => m[1]);
      assert.equal(tones.length, 27);
      assert.deepEqual([...new Set(tones)].sort(), ['bw', 'colour']);
      assert.equal(tones.filter((t) => t === 'bw').length, 17);
      assert.equal(tones.filter((t) => t === 'colour').length, 10);
    });

    test(`${route} shows three chips with their counts, "all" pressed`, () => {
      const page = html(route);
      const group = page.match(/<div data-gallery-filters[\s\S]*?<\/div>/)![0];

      for (const [slug, label] of [
        ['all', dict.work.filters.all],
        ['bw', dict.work.filters.bw],
        ['colour', dict.work.filters.colour],
      ] as const) {
        assert.ok(group.includes(`data-filter="${slug}"`), `no ${slug} chip`);
        assert.ok(group.includes(label), `chip label missing: ${label}`);
      }

      assert.equal(
        (group.match(/aria-pressed="true"/g) ?? []).length,
        1,
        'exactly one chip is active',
      );
      assert.match(
        group,
        /data-filter="all"[^>]*aria-pressed="true"/,
        '"all" should be the default',
      );
      assert.match(group, /role="group" aria-label="/, 'the row needs an accessible name');
    });

    test(`${route} loads the first three eagerly and the rest lazily`, () => {
      const gallery = html(route).match(/<ul data-gallery[\s\S]*?<\/ul>/)![0];
      assert.equal((gallery.match(/loading="eager"/g) ?? []).length, 3);
      assert.equal((gallery.match(/loading="lazy"/g) ?? []).length, 24);
    });

    test(`${route} never requests an image wider than its source`, () => {
      for (const tag of html(route).matchAll(/<img[^>]+>/g)) {
        const width = Number(tag[0].match(/\swidth="(\d+)"/)?.[1] ?? 0);
        const widths = [...(tag[0].match(/srcset="([^"]+)"/)?.[1] ?? '').matchAll(/(\d+)w/g)].map(
          (m) => Number(m[1]),
        );
        if (!width || !widths.length) continue;
        assert.deepEqual(
          widths.filter((w) => w > width),
          [],
          `a ${width}px source asked for more`,
        );
      }
    });

    test(`${route} has an empty state, hidden until a filter empties`, () => {
      const page = html(route);
      assert.match(page, /data-gallery-empty[^>]*hidden/);
      assert.ok(page.includes(dict.work.filters.empty));
      assert.ok(page.includes(dict.work.filters.showAll));
    });

    test(`${route} announces the count politely with both plural forms available`, () => {
      const page = html(route);
      const el = page.match(/<p\s+data-photo-count[\s\S]*?<\/p>/)![0];
      assert.match(el, /aria-live="polite"/);
      assert.ok(el.includes(dict.work.photoCount(1)), 'no singular form for the script');
      assert.ok(el.includes(dict.work.photoCount(0).replace('0', '{n}')), 'no plural template');
      assert.ok(page.includes(dict.work.photoCount(27)), 'the server-rendered count is wrong');
    });
  }

  test('the two languages render the same photographs in the same order', () => {
    const ids = (route: string) => [...html(route).matchAll(/data-id="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ids('/en/my-work'), ids('/mi-trabajo'));
  });
});

describe('lightbox semantics', () => {
  for (const route of ['/mi-trabajo', '/en/my-work', '/', '/en']) {
    test(`${route} has exactly one dialog, closed`, () => {
      const page = html(route);
      const dialogs = page.match(/<div\s+data-lightbox(?=[\s>])[^>]*>/g) ?? [];
      assert.equal(dialogs.length, 1, 'one dialog per page, not one per photo');

      const dialog = dialogs[0];
      assert.match(dialog, /role="dialog"/);
      assert.match(dialog, /aria-modal="true"/);
      assert.match(dialog, /aria-label="[^"]+"/, 'the dialog needs an accessible name');
      assert.match(dialog, /\shidden\b/, 'it must start closed and out of the tab order');
    });

    test(`${route} makes every photograph a button with an accessible name`, () => {
      const gallery = html(route).match(/<ul[^>]*data-gallery[\s\S]*?<\/ul>/)![0];
      const triggers = [...gallery.matchAll(/<button[^>]*data-lightbox-open[^>]*>/g)].map(
        (m) => m[0],
      );
      assert.ok(triggers.length > 0, 'no photograph opens the lightbox');

      for (const trigger of triggers) {
        assert.match(trigger, /aria-haspopup="dialog"/, 'a trigger does not announce the dialog');
        const label = trigger.match(/aria-label="([^"]*)"/)?.[1] ?? '';
        assert.ok(label.trim().length > 3, `weak trigger name: "${label}"`);
      }
    });
  }

  test('the counter template is localised, with placeholders for the script', () => {
    const template = (route: string) =>
      html(route).match(/data-lightbox-counter\s+data-template="([^"]+)"/)?.[1];
    assert.equal(template('/mi-trabajo'), '{i} de {n}');
    assert.equal(template('/en/my-work'), '{i} of {n}');
  });

  test('navigation is announced politely', () => {
    assert.match(html('/mi-trabajo'), /data-lightbox-live[^>]*aria-live="polite"/);
  });

  test('prev and next exist for both pointer and touch layouts', () => {
    const dialog = html('/mi-trabajo').match(/<div\s+data-lightbox(?=[\s>])[\s\S]*?<script/)![0];
    assert.equal((dialog.match(/data-lightbox-prev/g) ?? []).length, 2, 'edge button + mobile bar');
    assert.equal((dialog.match(/data-lightbox-next/g) ?? []).length, 2);
  });

  test('the lightbox carries no URL state, so Esc and browser-back stay predictable', () => {
    const script = readFileSync(join(import.meta.dirname, '..', 'src/scripts/lightbox.ts'), 'utf8');
    assert.ok(!script.includes('pushState'), 'the lightbox must not push history');
    assert.ok(!script.includes('location.hash'), 'the lightbox must not own the URL');
  });

  test('it walks only visible cards, which is what makes filtering agree with it', () => {
    const script = readFileSync(join(import.meta.dirname, '..', 'src/scripts/lightbox.ts'), 'utf8');
    assert.match(
      script,
      /filter\(\(card\) => !card\.hidden\)/,
      'navigation must skip cards the tone filter has hidden',
    );
  });
});

describe('structured data', () => {
  test('the work page describes its gallery, crediting the Person by @id', () => {
    const raw = html('/mi-trabajo').match(/application\/ld\+json[^>]*>([\s\S]*?)<\/script>/)![1];
    const gallery = JSON.parse(raw).find(
      (node: Record<string, unknown>) => node['@type'] === 'ImageGallery',
    );
    assert.ok(gallery, 'no ImageGallery node');
    assert.equal(gallery.associatedMedia.length, 27);
    assert.ok(gallery.author['@id'].endsWith('#person'));

    for (const media of gallery.associatedMedia) {
      assert.equal(media['@type'], 'ImageObject');
      assert.ok(media.contentUrl.startsWith('https://'), 'contentUrl must be absolute');
      assert.ok(media.description?.length > 10, 'every image needs its alt as a description');
    }
  });
});

describe('lightbox bugs that shipped once', () => {
  const script = readFileSync(join(import.meta.dirname, '..', 'src/scripts/lightbox.ts'), 'utf8');

  /**
   * The dialog is authored inside the page, so it renders inside <main>. open() marks
   * every body child except the dialog as inert — which put <main> inert with the
   * dialog inside it. Close, arrows, focus and swipe were all dead, and nothing in the
   * markup looked wrong.
   */
  test('the dialog is moved to <body> before the inert set is computed', () => {
    assert.match(
      script,
      /dialog\.parentElement !== document\.body.*document\.body\.appendChild\(dialog\)/s,
      'without the portal, marking <main> inert disables the dialog itself',
    );

    const portalAt = script.indexOf('document.body.appendChild(dialog)');
    const inertAt = script.indexOf('sibling.inert = true');
    assert.ok(portalAt > 0 && portalAt < inertAt, 'the portal must happen before open()');
  });

  test('the dialog is authored inside the page, which is why the portal is required', () => {
    // If this ever stops being true the portal is harmless, but the comment explaining
    // it would become misleading — so the assumption is pinned rather than assumed.
    const page = html('/mi-trabajo');
    const dialogAt = page.search(/<div\s+data-lightbox(?=[\s>])/);
    assert.ok(dialogAt > page.indexOf('<main'), 'dialog is no longer inside <main>');
  });

  /**
   * Navigating to a photograph that had not loaded left the PREVIOUS one on screen:
   * the counter moved, the picture did not, and on a slow connection it read as a
   * dead control.
   */
  test('the previous frame is hidden and a spinner shown until the next decodes', () => {
    assert.match(script, /image\.removeAttribute\('data-shown'\)/, 'the old frame is not cleared');
    assert.match(script, /spinner\.hidden = false/, 'no loading state while decoding');
    assert.match(script, /image\s*\n?\s*\.decode\(\)/, 'reveal must wait for a paintable frame');

    for (const route of ['/mi-trabajo', '/']) {
      const page = html(route);
      assert.match(page, /data-lightbox-spinner[^>]*hidden/, `${route}: no spinner, or not hidden`);
      assert.match(
        page,
        /data-lightbox-spinner[^>]*role="status"/,
        `${route}: spinner is not announced`,
      );
    }
  });

  test('a slow decode cannot overwrite a newer navigation', () => {
    assert.match(script, /let requestToken = 0/, 'no race guard');
    assert.match(script, /if \(token !== requestToken\) return/, 'a stale decode can still win');
  });

  test('the swipe follows the finger rather than firing only on release', () => {
    assert.match(script, /pointermove/, 'no drag tracking');
    assert.match(script, /setPointerCapture/, 'the gesture is lost once it leaves the element');
    assert.match(script, /axis \?\?=/, 'a diagonal drag would jitter between axes');

    // The browser must not claim the horizontal gesture for scrolling first.
    assert.match(html('/mi-trabajo'), /data-lightbox-stage[^>]*touch-none/);
  });
});
