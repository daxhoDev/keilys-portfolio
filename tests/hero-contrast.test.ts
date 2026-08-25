/**
 * The hero is the only place on this site where text sits on a photograph, so its
 * contrast is a property of whichever file Keily sends — not of the CSS alone. Her
 * first hero is a bright image: the headline block sits on mean 197 grey, which is
 * 1.53:1 against bone.
 *
 * The nav is not covered here. It no longer relies on the veil at all: the header
 * switches to dark ink while it sits over the photograph. That is measured separately
 * by `npm run check:hero`, which reports it as a warning rather than a failure —
 * see the note in that script.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { measureHero, contrast, VEIL } from '../scripts/check-hero-contrast.mjs';

describe('hero contrast against the real photograph', () => {
  test('every light-text region clears AA at its brightest pixel', async () => {
    for (const region of await measureHero()) {
      assert.ok(
        region.passes,
        `${region.name}: ${region.worst.toFixed(2)}:1 at the brightest pixel, needs ${region.min}:1. ` +
          `Darken hero-veil in src/styles/global.css, or choose a hero with a calmer lower-left.`,
      );
    }
  });

  test('the veil is doing the work, not luck — the bare photograph fails', async () => {
    // Guards against someone "simplifying" the veil away because the page looks fine
    // on their monitor. Without it, this hero is far below AA.
    const bare = contrast([197, 197, 197], [0xf2, 0xf1, 0xef]);
    assert.ok(bare < 2, `the unveiled hero measures ${bare.toFixed(2)}:1`);
  });
});

describe('the probe stays in step with the stylesheet', () => {
  /**
   * check-hero-contrast.mjs mirrors @utility hero-veil. If the CSS is retuned and the
   * probe is not, the probe reports contrast the site does not have — which is worse
   * than having no probe.
   */
  const css = readFileSync(join(import.meta.dirname, '..', 'src/styles/global.css'), 'utf8');
  const veil = css.match(/@utility hero-veil \{[\s\S]*?\n\}/)?.[0] ?? '';

  test('the veil carries exactly two layers: no top gradient, no vignette', () => {
    assert.ok(veil, 'hero-veil is gone from global.css');
    assert.equal(
      (veil.match(/linear-gradient/g) ?? []).length,
      2,
      'expected a bottom gradient and a flat dim',
    );
    assert.ok(
      !veil.includes('radial-gradient'),
      'the vignette read as a visible circle and was removed',
    );
    assert.ok(
      !/to bottom/.test(veil),
      'the top gradient was removed deliberately — the header goes dark over the hero instead',
    );
  });

  test('the flat dim in the CSS matches the probe', () => {
    const percent = Math.round(VEIL.flatDim * 100);
    const flat = veil.match(/linear-gradient\(\s*color-mix\(in srgb, var\(--color-ink\) (\d+)%/);
    assert.ok(flat, 'no flat dim layer found');
    assert.equal(Number(flat[1]), percent, 'the probe and the stylesheet disagree about the dim');
  });

  test('the bottom gradient stops in the CSS match the probe', () => {
    const stops = [...veil.matchAll(/var\(--color-ink\) (\d+)%, transparent\) (\d+)%/g)].map(
      (m) => [Number(m[2]) / 100, Number(m[1]) / 100],
    );
    for (const [position, alpha] of VEIL.bottom.filter(([, a]) => a > 0 && a < 1)) {
      assert.ok(
        stops.some(([p, a]) => Math.abs(p - position) < 0.01 && Math.abs(a - alpha) < 0.01),
        `the CSS has no bottom-gradient stop at ${position * 100}% / ${alpha * 100}%`,
      );
    }
  });
});
