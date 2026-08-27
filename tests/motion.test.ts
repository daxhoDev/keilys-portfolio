/**
 * The motion layer.
 *
 * The rule worth protecting here is not a duration — it is that content is never
 * hidden by something that might not run. The hidden state is gated on `.js`, which an
 * inline script sets before first paint; if that gate is ever dropped, a JS failure
 * turns into a blank page rather than a page without animation.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const html = (route: string) =>
  readFileSync(
    join(DIST, route === '/' ? 'index.html' : `${route.replace(/^\//, '')}/index.html`),
    'utf8',
  );

const css = () => {
  const sheet = readdirSync(join(DIST, '_astro')).find((f) => f.endsWith('.css'))!;
  return readFileSync(join(DIST, '_astro', sheet), 'utf8');
};

before(() => assert.ok(existsSync(DIST), 'run `npm run build` first'));

/** The page with <script> contents removed: selector strings inside them are not markup. */
const markup = (route: string) => html(route).replace(/<script[\s\S]*?<\/script>/g, '');

describe('nothing is hidden without JavaScript', () => {
  test('every hidden state is scoped to .js', () => {
    const sheet = css();
    // Each rule that hides a revealable element must be behind the .js gate.
    const hidingRules = [...sheet.matchAll(/([^{}]*)\{[^}]*opacity:\s*0[^}]*\}/g)]
      .map((m) => m[1])
      .filter((selector) => /data-reveal|data-hero/.test(selector));

    assert.ok(hidingRules.length > 0, 'no reveal hiding rules found at all');
    for (const selector of hidingRules) {
      assert.match(selector, /\.js\b/, `unguarded hidden state: ${selector.trim()}`);
    }
  });

  test('the .js class is set inline in the head, not by a module', () => {
    const page = html('/');
    const head = page.slice(0, page.indexOf('</head>'));
    assert.match(head, /classList\.add\('js'\)/, 'the gate is not set before paint');
    // A module script would run after first paint and every element would flash in.
    assert.ok(!/type="module"[^>]*>[^<]*classList\.add\('js'\)/.test(head));
  });

  test('the reveal markup carries no inline opacity of its own', () => {
    // If an element were hidden by a style attribute, the .js gate could not save it.
    for (const route of ['/', '/sobre-mi', '/mi-trabajo']) {
      assert.ok(!/style="[^"]*opacity:\s*0/.test(html(route)), `${route} hides content inline`);
    }
  });
});

describe('reduced motion', () => {
  /**
   * Every reduced-motion block in the sheet, concatenated. There is more than one (the
   * base layer has its own), and the minifier drops the space after @media — so this
   * brace-matches rather than guessing an offset from a string search.
   */
  const block = () => {
    const sheet = css();
    const pattern = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{/g;
    let found = '';

    for (const match of sheet.matchAll(pattern)) {
      let depth = 1;
      let i = match.index! + match[0].length;
      while (i < sheet.length && depth > 0) {
        if (sheet[i] === '{') depth += 1;
        else if (sheet[i] === '}') depth -= 1;
        i += 1;
      }
      found += sheet.slice(match.index! + match[0].length, i);
    }

    assert.ok(found.length > 0, 'there is no reduced-motion block at all');
    return found;
  };

  test('reveals and the hero are forced visible, not merely un-animated', () => {
    const rules = block();
    assert.match(rules, /opacity:1!important/);
    assert.match(rules, /transform:none!important/);
  });

  test('parallax is neutralised', () => {
    assert.match(block(), /\[data-parallax\]/);
  });

  test('the scripts honour the preference too, not just the stylesheet', () => {
    // CSS alone would still leave the observer and the scroll listener running.
    for (const file of ['reveal.ts', 'parallax.ts', 'hero-reveal.ts']) {
      const source = readFileSync(join(ROOT, 'src/scripts', file), 'utf8');
      assert.match(source, /prefers-reduced-motion/, `${file} ignores the preference`);
    }
  });

  test('a mid-session change is picked up without a reload', () => {
    for (const file of ['reveal.ts', 'parallax.ts']) {
      const source = readFileSync(join(ROOT, 'src/scripts', file), 'utf8');
      assert.match(source, /addEventListener\('change'/, `${file} never re-evaluates the query`);
    }
  });
});

describe('what is animated', () => {
  test('only transform and opacity — never width, top, or filter', () => {
    const sheet = css();
    const transitions = [...sheet.matchAll(/transition:([^;}]+)/g)].map((m) => m[1]);

    for (const value of transitions) {
      for (const forbidden of ['width', 'height', 'top', 'left', 'filter', 'background-position']) {
        assert.ok(
          !new RegExp(`(^|[\\s,])${forbidden}\\s`).test(value),
          `a transition animates ${forbidden}: ${value.trim()}`,
        );
      }
    }
  });

  test('photographs never animate a filter', () => {
    const card = readFileSync(join(ROOT, 'src/components/gallery/PhotoCard.astro'), 'utf8');
    assert.ok(!/transition-\[filter\]|transition:.*filter/.test(card));
  });
});

describe('timings', () => {
  test('the entrance is slow enough to be seen', () => {
    const sheet = css();
    const entrance = sheet.match(/--duration-entrance:\s*([0-9.]+)(m?s)/);
    assert.ok(entrance, 'no entrance duration token');

    const ms = entrance[2] === 's' ? Number(entrance[1]) * 1000 : Number(entrance[1]);
    assert.ok(ms >= 900, `entrance is ${ms}ms — too fast to register`);
  });

  test('hover stays quick, because a slow hover feels broken', () => {
    const sheet = css();
    const fast = sheet.match(/--duration-fast:\s*([0-9.]+)(m?s)/)!;
    const ms = fast[2] === 's' ? Number(fast[1]) * 1000 : Number(fast[1]);
    assert.ok(ms <= 250, `hover transition is ${ms}ms`);
  });

  test('the hero sequence runs in order and does not overlap itself', () => {
    const source = readFileSync(join(ROOT, 'src/scripts/hero-reveal.ts'), 'utf8');
    const timeline = [...source.matchAll(/'?([a-z-0-9]+)'?:\s*(\d+),/g)].map(([, key, value]) => [
      key,
      Number(value),
    ]) as [string, number][];

    assert.ok(timeline.length >= 7, 'the timeline is incomplete');

    const delays = timeline.map(([, value]) => value);
    assert.deepEqual(
      delays,
      [...delays].sort((a, b) => a - b),
      'the hero steps are out of order',
    );

    // The three headline lines must be distinguishable, or the mask reads as one block.
    const [line1, line2, line3] = delays;
    assert.ok(line2 - line1 >= 100, 'headline lines 1 and 2 are too close to read as a sequence');
    assert.ok(line3 - line2 >= 100, 'headline lines 2 and 3 are too close');
  });
});

describe('the reveal trigger point', () => {
  test('fires once the element has climbed into view, not the moment it appears', () => {
    const source = readFileSync(join(ROOT, 'src/scripts/reveal.ts'), 'utf8');
    const margin = source.match(/ROOT_MARGIN = '0px 0px (-?\d+)%/);
    assert.ok(margin, 'no root margin configured');

    const inset = Number(margin[1]);
    assert.ok(
      inset <= -15,
      `bottom inset is ${inset}% — an element fires as it appears and the animation is over before it is read`,
    );
  });

  test('reveals fire once and are then unobserved', () => {
    const source = readFileSync(join(ROOT, 'src/scripts/reveal.ts'), 'utf8');
    assert.match(source, /unobserve\(entry\.target\)/, 'reveals would replay on scroll-back');
  });

  test('stagger is capped, so a long list has no tail', () => {
    const source = readFileSync(join(ROOT, 'src/scripts/reveal.ts'), 'utf8');
    assert.match(source, /Math\.min\(index, cap\)/);
  });
});

describe('reveal coverage', () => {
  /**
   * "Every major block" is the spec's wording, so this counts rather than spot-checks.
   * The gallery cascade in particular was specified in 07-motion.md and simply never
   * wired to PhotoCard — the page looked finished and a third of it never animated.
   */
  const revealCount = (route: string) => (html(route).match(/data-reveal/g) ?? []).length;

  test('every content page reveals a substantial number of blocks', () => {
    for (const [route, minimum] of [
      ['/', 12],
      ['/en', 12],
      ['/sobre-mi', 12],
      ['/en/about', 12],
      ['/mi-trabajo', 25],
      ['/en/my-work', 25],
    ] as const) {
      assert.ok(
        revealCount(route) >= minimum,
        `${route} has only ${revealCount(route)} reveal targets`,
      );
    }
  });

  test('every gallery photograph is part of the cascade', () => {
    const page = markup('/mi-trabajo');
    // Not \b: a word boundary matches before a hyphen, so data-photo\b would also count
    // data-photo-count, and scripts are stripped because a querySelector string is not
    // markup. Both traps produced false failures here already.
    const cards = (page.match(/data-photo(?![-\w])/g) ?? []).length;
    const cascade = (page.match(/data-reveal="gallery"/g) ?? []).length;
    assert.equal(cascade, cards, 'some photographs are outside the entrance animation');
  });

  test('the featured grid on the landing page cascades too', () => {
    assert.ok((html('/').match(/data-reveal="gallery"/g) ?? []).length >= 6);
  });

  test('the blocks a person reads are all covered on the About page', () => {
    const page = html('/sobre-mi');
    // Header, eight paragraphs, portrait, secondary image, facts, closing band.
    assert.ok((page.match(/data-reveal/g) ?? []).length >= 13);
  });

  test('the contact form and its sidebar are revealed, not just the heading', () => {
    const page = html('/');
    assert.match(page, /data-reveal[^>]*data-contact/, 'the form itself never animates');
    assert.match(
      page,
      /<aside[^>]*data-reveal|data-reveal[^>]*<aside/,
      'the socials sidebar is static',
    );
  });
});

describe('Reveal forwards what it wraps', () => {
  /**
   * Reveal wraps elements that scripts find by data-* and that carry `hidden`. An
   * earlier version dropped unknown props, which silently detached the contact
   * controller and the gallery's empty state from their markup.
   */
  test('data attributes survive the wrapper', () => {
    assert.match(html('/'), /data-reveal[^>]*data-contact/, 'data-contact was dropped');
    assert.match(
      html('/mi-trabajo'),
      /data-reveal[^>]*data-gallery-empty/,
      'data-gallery-empty was dropped',
    );
  });

  test('the hidden attribute survives, or the empty state shows on every load', () => {
    assert.match(
      html('/mi-trabajo'),
      /data-gallery-empty[^>]*hidden|hidden[^>]*data-gallery-empty/,
    );
  });

  test('the component actually spreads the rest of its props', () => {
    const source = readFileSync(join(ROOT, 'src/components/motion/Reveal.astro'), 'utf8');
    assert.match(source, /\{\.\.\.rest\}/, 'Reveal drops unknown attributes again');
  });
});
