/**
 * Every design-token utility used in a component must actually emit a rule.
 *
 * This exists because of a defect that survived three phases: `duration-base` and
 * friends produced NO CSS at all. Tailwind v4 has no `--duration-*` theme namespace,
 * so `duration-base` was not an unknown class it could warn about — it was simply
 * nothing, and every transition written against the tokens silently fell back to the
 * default 150ms. Nothing failed. It just was not what the design said.
 *
 * Same family as the `bg-${token}` bug in Phase 1: a class that looks right, compiles
 * fine, and produces no style.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');

/** Every class token written in src/, flattened out of class="" and class:list={[…]}. */
function classesUsedInSource(): Set<string> {
  const found = new Set<string>();

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(astro|ts)$/.test(entry.name)) {
        const source = readFileSync(path, 'utf8');
        for (const match of source.matchAll(/'([^'\n]*?)'|"([^"\n]*?)"/g)) {
          const literal = match[1] ?? match[2] ?? '';
          if (!/[a-z]-|:/.test(literal)) continue;
          for (const token of literal.split(/\s+/)) if (token) found.add(token);
        }
      }
    }
  };

  walk(join(ROOT, 'src'));
  return found;
}

const stylesheet = () => {
  const file = readdirSync(join(DIST, '_astro')).find((f) => f.endsWith('.css'))!;
  return readFileSync(join(DIST, '_astro', file), 'utf8');
};

describe('design-token utilities emit real CSS', () => {
  test('dist exists', () => assert.ok(existsSync(DIST), 'run `npm run build` first'));

  /**
   * Token-derived families only. Standard Tailwind utilities are Tailwind's problem;
   * these are ours, and they are the ones that fail silently.
   */
  const TOKEN_PREFIXES = [
    'duration-',
    'ease-',
    'text-display-',
    'text-body',
    'text-label',
    'text-eyebrow',
    'max-w-content',
    'max-w-narrow',
    'max-w-wide',
  ];

  const CUSTOM_UTILITIES = [
    'font-display',
    'gutter-x',
    'section-y',
    'section-y-tight',
    'measure',
    'measure-lead',
    'hero-veil',
  ];

  test('every token utility written in a component produces a rule', () => {
    const css = stylesheet();
    const used = [...classesUsedInSource()]
      .map((token) => token.replace(/^.*:/, '')) // strip variants: md:, group-data-[…]:
      .filter((token) => TOKEN_PREFIXES.some((prefix) => token.startsWith(prefix)));

    assert.ok(used.length > 5, 'the source scan found almost nothing — the scanner is broken');

    // Tailwind escapes / in class names (text-ink/70 -> .text-ink\/70).
    const missing = [...new Set(used)].filter(
      (token) => !css.includes(`.${token.replaceAll('/', '\\/')}`),
    );

    assert.deepEqual(missing, [], `these classes emit no CSS: ${missing.join(', ')}`);
  });

  test('every custom @utility is defined and emitted', () => {
    const css = stylesheet();
    const source = readFileSync(join(ROOT, 'src/styles/global.css'), 'utf8');

    for (const utility of CUSTOM_UTILITIES) {
      assert.match(
        source,
        new RegExp(`@utility ${utility} \\{`),
        `@utility ${utility} is not defined`,
      );
      assert.ok(css.includes(`.${utility}`), `@utility ${utility} is defined but never emitted`);
    }
  });

  test('the duration tokens resolve to the documented values', () => {
    const css = stylesheet();
    const source = readFileSync(join(ROOT, 'src/styles/global.css'), 'utf8');

    // The stylesheet is minified: 180ms becomes .18s. Compare the value, not the text.
    const seconds = (raw: string) =>
      raw.endsWith('ms') ? Number(raw.slice(0, -2)) / 1000 : Number(raw.slice(0, -1));

    for (const [name, expected] of [
      ['fast', 0.18],
      ['menu', 0.28],
      ['base', 0.32],
      ['slow', 0.6],
    ] as const) {
      const declared = css.match(new RegExp('--duration-' + name + ':\\s*([0-9.]+m?s)'))?.[1];
      assert.ok(declared, '--duration-' + name + ' is not in the stylesheet');
      assert.equal(seconds(declared), expected, '--duration-' + name + ' drifted');

      // Every token has a utility; Tailwind only EMITS the ones in use, so emission is
      // asserted by the source scan above rather than here.
      assert.match(
        source,
        new RegExp('@utility duration-' + name + ' \\{'),
        'no utility for --duration-' + name,
      );
    }
  });

  test('hover effects are gated to pointer devices', () => {
    // On touch, :hover sticks after a tap — the zoom would never release.
    assert.match(
      readFileSync(join(ROOT, 'src/styles/global.css'), 'utf8'),
      /@custom-variant hover-hover/,
    );
    assert.match(stylesheet(), /@media\s*\(hover:\s*hover\)/);
  });
});

describe('the stylesheet contains no broken declarations', () => {
  /**
   * Tailwind's arbitrary-value syntax will happily produce invalid CSS. A negative
   * margin written with a bare custom-property name compiled to a calc() containing
   * that name with no var() around it — which every browser silently drops. Nothing
   * warns; the rule is simply inert.
   *
   * The broken class is not written out anywhere, including in comments: Tailwind
   * scans this file as source, so naming it would re-emit the very rule under test.
   */
  test('no calc() references a custom property without var()', () => {
    const css = stylesheet();
    const broken = [...css.matchAll(/calc\([^)]*?(?<!var\()--[a-z-]+/g)].map((m) => m[0]);
    assert.deepEqual(broken, [], `invalid calc(): ${broken.join(', ')}`);
  });

  test('no declaration is an empty or obviously malformed value', () => {
    const css = stylesheet();
    assert.ok(!/:\s*;/.test(css), 'an empty declaration value was emitted');
    assert.ok(!/var\(\s*\)/.test(css), 'an empty var() was emitted');
  });
});
