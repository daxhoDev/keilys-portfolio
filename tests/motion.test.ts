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
