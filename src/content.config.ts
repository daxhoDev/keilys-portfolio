import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Every visible string exists in both languages, or the entry does not build. */
const localized = z.object({ es: z.string(), en: z.string() });

const photos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/photos' }),
  schema: ({ image }) =>
    z.object({
      /** The image file. Astro validates it exists and infers its dimensions. */
      src: image(),

      /** Required, both languages. Describes the photograph for someone who cannot see it. */
      alt: localized,

      /** Optional display title, shown on hover and in the lightbox. */
      title: localized.optional(),

      /** Optional longer caption, lightbox only. */
      caption: localized.optional(),

      /**
       * What the gallery filters on (decision #1 = D). The default exists only so a
       * half-written entry does not fail the build; every real photo states it.
       */
      tone: z.enum(['bw', 'colour']).default('bw'),

      /** Named body of work. Unused by the UI — reserved for her own bookkeeping. */
      series: z.string().optional(),

      /** Subject tags. Unused by the UI. */
      tags: z.array(z.string()).default([]),

      /** Shown in the landing page's featured grid. Exactly 6 must be true. */
      featured: z.boolean().default(false),

      /** Manual sort key, ascending. Ties broken by id. */
      order: z.number().default(0),

      /** Year or year-month, e.g. "2026" or "2026-03". Display only. */
      capturedAt: z.string().optional(),

      /** Excluded from the site without deleting the file. */
      draft: z.boolean().default(false),
    }),
});

export const collections = { photos };
