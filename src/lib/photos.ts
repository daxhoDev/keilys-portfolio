import { getCollection, type CollectionEntry } from 'astro:content';

// Re-exported so call sites have one import, while the rules themselves stay in a
// module free of astro: imports and therefore unit-testable.
export {
  TONE_FILTERS,
  parseToneFilter,
  shouldShowToneFilters,
  type ToneFilter,
} from './tone-filter.ts';

export type Photo = CollectionEntry<'photos'>;
export type Tone = Photo['data']['tone'];

/** The landing page shows exactly this many. The build fails if fewer are marked. */
export const FEATURED_COUNT = 6;

/**
 * draft: true is filtered here rather than at the call site, so a draft can never be
 * counted by a filter chip it does not appear in.
 */
async function published(): Promise<Photo[]> {
  const entries = await getCollection('photos', ({ data }) => !data.draft);
  return entries.sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
}

export async function getAllPhotos(): Promise<Photo[]> {
  return published();
}

/**
 * Exactly six, and it throws rather than rendering a short grid: a five-photo
 * featured row looks like a layout bug and would ship unnoticed.
 */
export async function getFeaturedPhotos(): Promise<Photo[]> {
  const featured = (await published()).filter((photo) => photo.data.featured);

  if (featured.length < FEATURED_COUNT) {
    throw new Error(
      `Expected ${FEATURED_COUNT} featured photographs, found ${featured.length}. ` +
        `Mark more entries with featured: true in src/content/photos/.`,
    );
  }

  return featured.slice(0, FEATURED_COUNT);
}

/** Counts for the filter chips. Zero is a real answer and is rendered as a disabled chip. */
export async function getToneCounts(): Promise<Record<Tone, number>> {
  const all = await published();
  return {
    bw: all.filter((photo) => photo.data.tone === 'bw').length,
    colour: all.filter((photo) => photo.data.tone === 'colour').length,
  };
}
