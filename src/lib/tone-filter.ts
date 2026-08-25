/**
 * Tone-filter rules, kept free of any `astro:` import so they can be unit-tested
 * directly. photos.ts re-exports them, so call sites still have one place to import
 * from.
 */

/** Mirrors the `tone` enum in src/content.config.ts. */
export type Tone = 'bw' | 'colour';

/** Valid values for ?filter=. Anything else falls back to showing everything. */
export const TONE_FILTERS = ['all', 'bw', 'colour'] as const;
export type ToneFilter = (typeof TONE_FILTERS)[number];

export function parseToneFilter(value: string | null | undefined): ToneFilter {
  return TONE_FILTERS.includes(value as ToneFilter) ? (value as ToneFilter) : 'all';
}

/**
 * Whether the tone filter row is worth showing at all.
 *
 * If every photograph shares one tone, one live chip beside a disabled one is not a
 * choice — it is decoration that also advertises what is missing. A real possibility
 * rather than a hypothetical: if Keily only ever sends black and white, the Colour chip
 * is empty (specs/05-pages-and-sections.md § My work).
 */
export function shouldShowToneFilters(counts: Record<Tone, number>): boolean {
  return counts.bw > 0 && counts.colour > 0;
}
