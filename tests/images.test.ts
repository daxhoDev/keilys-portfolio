/**
 * Nothing is ever upscaled. Some of Keily's photographs do not reach 2400px, and a
 * widths array containing values above the source produces duplicate sources and a
 * srcset that lies. See specs/04-content-model.md § Photographs smaller than 2400px.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  responsiveWidths,
  isUndersized,
  GALLERY_MIN_LONG_EDGE,
  HERO_MIN_WIDTH,
} from '../src/lib/images.ts';

const GALLERY_CANDIDATES = [400, 700, 1000, 1400, 2000, 2400];

describe('responsiveWidths', () => {
  test('never returns a width larger than the source', () => {
    for (const width of [1, 320, 880, 1100, 1300, 1600, 2400, 4000]) {
      for (const w of responsiveWidths({ width }, GALLERY_CANDIDATES)) {
        assert.ok(w <= width, `${w} exceeds source ${width}`);
      }
    }
  });

  test('always includes the source width, so the largest variant is the real file', () => {
    for (const width of [880, 1300, 2400]) {
      assert.ok(responsiveWidths({ width }, GALLERY_CANDIDATES).includes(width));
    }
  });

  test('returns ascending, unique widths', () => {
    const widths = responsiveWidths({ width: 2400 }, [1400, 400, 400, 1000]);
    assert.deepEqual(
      widths,
      [...new Set(widths)].sort((a, b) => a - b),
    );
  });

  test('a source smaller than every candidate yields exactly one width', () => {
    assert.deepEqual(responsiveWidths({ width: 320 }, GALLERY_CANDIDATES), [320]);
  });

  test('handles the two deliberately undersized placeholders', () => {
    assert.deepEqual(responsiveWidths({ width: 880 }, GALLERY_CANDIDATES), [400, 700, 880]);
    assert.deepEqual(responsiveWidths({ width: 1300 }, GALLERY_CANDIDATES), [400, 700, 1000, 1300]);
  });

  test('drops non-positive candidates rather than emitting them', () => {
    assert.deepEqual(responsiveWidths({ width: 1000 }, [0, -100, 400]), [400, 1000]);
  });

  test('never returns an empty array', () => {
    assert.ok(responsiveWidths({ width: 1 }, []).length > 0);
  });
});

describe('isUndersized', () => {
  test('measures the long edge, not the width', () => {
    assert.equal(isUndersized({ width: 880, height: 1100 }), true);
    assert.equal(isUndersized({ width: 1300, height: 867 }), true);
    assert.equal(isUndersized({ width: 1600, height: 2000 }), false, 'portrait 1600x2000 is fine');
    assert.equal(isUndersized({ width: 2400, height: 1600 }), false);
  });

  test('the floor is the documented one', () => {
    assert.equal(GALLERY_MIN_LONG_EDGE, 1400);
    assert.equal(HERO_MIN_WIDTH, 2000);
  });
});
