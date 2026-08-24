/**
 * Responsive width helpers.
 *
 * Some of Keily's photographs do not reach 2400px on the long edge, and nothing
 * is ever upscaled: a `widths` array containing values above the native width
 * produces duplicate sources and a misleading srcset. Every <Image> in the build
 * takes its widths from here rather than from a literal.
 *
 * See specs/04-content-model.md § Photographs smaller than 2400px.
 */

/** Long edge below which a gallery photograph visibly softens at grid size. */
export const GALLERY_MIN_LONG_EDGE = 1400;

/** The hero runs full-bleed at 100vw, so it is the one image where a small file shows. */
export const HERO_MIN_WIDTH = 2000;

type Sized = { width: number };

/**
 * Candidate widths with anything wider than the source dropped, plus the source's
 * own width as the ceiling. Always returns at least one width, ascending, unique.
 */
export function responsiveWidths(img: Sized, candidates: number[]): number[] {
  const widths = new Set(candidates.filter((c) => c > 0 && c < img.width));
  widths.add(img.width);
  return [...widths].sort((a, b) => a - b);
}

/** True when a gallery photograph is below the comfortable floor. Drives a build warning. */
export function isUndersized(img: Sized & { height?: number }): boolean {
  const longEdge = Math.max(img.width, img.height ?? 0);
  return longEdge < GALLERY_MIN_LONG_EDGE;
}
