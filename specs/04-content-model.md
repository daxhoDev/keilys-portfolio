# 04 · Content model

## Photographs — content collection

One Markdown file per photograph in `src/content/photos/`. The image file lives beside the collection in
`src/assets/photos/` and is referenced by relative path so Astro's `image()` helper resolves and optimises it.

### Schema — `src/content/config.ts`

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const localized = z.object({ en: z.string(), es: z.string() });

const photos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/photos' }),
  schema: ({ image }) =>
    z.object({
      /** The image file. Astro validates it exists and infers dimensions. */
      src: image(),

      /** Required, both languages. Describes the photograph for screen readers. */
      alt: localized,

      /** Optional display title, shown on hover and in the lightbox. */
      title: localized.optional(),

      /** Optional longer caption / story, lightbox only. */
      caption: localized.optional(),

      /** Named body of work. Drives filtering if open decision #1 resolves to series. */
      series: z.string().optional(),

      /** Subject tags. Drives filtering if open decision #1 resolves to categories. */
      tags: z.array(z.string()).default([]),

      /** Monochrome or colour. Drives filtering if open decision #1 resolves to tone. */
      tone: z.enum(['bw', 'colour']).default('bw'),

      /** Shown in the `/` "My Work" section. Exactly 6 entries must be true. */
      featured: z.boolean().default(false),

      /** Manual sort key, ascending. Ties broken by filename. */
      order: z.number().default(0),

      /** ISO 8601 date or year string, e.g. "2024-03" or "2023". Display only. */
      capturedAt: z.string().optional(),

      /** Excluded from the site without deleting the file. */
      draft: z.boolean().default(false),
    }),
});

export const collections = { photos };
```

**The schema deliberately carries `series`, `tags` **and** `tone` simultaneously.** Every option for gallery
organisation ([open decision #1](./09-open-decisions.md#1--gallery-organisation)) is satisfiable from this
schema, so photo metadata can be authored now and the filtering UI decided later without re-entering data.

### Example entry — `src/content/photos/quiet-rooms-01.md`

```md
---
src: ../../assets/photos/quiet-rooms-01.jpg
alt:
  en: A bare window casting a hard rectangle of light across an empty wooden floor.
  es: Una ventana desnuda proyecta un rectángulo de luz sobre un suelo de madera vacío.
title:
  en: Morning, west room
  es: Mañana, habitación oeste
series: quiet-rooms
tags: [interior, light]
tone: bw
featured: true
order: 10
capturedAt: '2024-03'
---
```

The Markdown body is unused for now. It is reserved for the per-photo detail pages that
[open decision #2](./09-open-decisions.md#2--photo-click-behaviour) may introduce.

### Query helpers — `src/lib/photos.ts`

```ts
getAllPhotos(): Promise<Photo[]>              // draft:false, sorted by order then id
getFeaturedPhotos(): Promise<Photo[]>         // featured:true, sorted, sliced to 6
getSeries(): Promise<SeriesSummary[]>         // distinct series with counts, in seriesOrder
```

`draft: true` entries are filtered out in **every** helper, not at the call site.

## Series — `src/i18n/series.ts`

Series slugs need display names in both languages and a deliberate order. They are small and few, so they
live in a plain typed record rather than a second collection:

```ts
export const SERIES_ORDER = ['quiet-rooms', 'streetlight', 'coastline'] as const;
export type SeriesSlug = (typeof SERIES_ORDER)[number];

export const SERIES: Record<SeriesSlug, { label: Record<Lang, string> }> = { /* … */ };
```

A `series` value in a photo entry that is not in `SERIES_ORDER` fails the build with a clear error.
This file is only *used* if open decision #1 resolves to series, but it is authored regardless.

## Standalone images

Not part of the collection; imported directly.

| File | Aspect | Min dimensions | Use |
|---|---|---|---|
| `src/assets/hero.jpg` | 3:2 landscape | 2400 × 1600 | Landing hero background |
| `src/assets/portrait.jpg` | 4:5 portrait | 1200 × 1500 | "About Me" section on `/` and on `/about` |
| `src/assets/about-secondary.jpg` | 3:2 landscape | 1800 × 1200 | Second image on `/about` |
| `public/og-default.jpg` | 1.91:1 | 1200 × 630 | Open Graph / Twitter card |

Alt text for these four lives in the translation files, not in frontmatter.

## Translation key inventory

The complete set of keys. Both `en.ts` and `es.ts` implement all of them; TypeScript enforces parity.

Keys are listed with their English gloss for readability; the authoritative values are written in Spanish
first (`es.ts` is the source of truth — see
[03-information-architecture.md](./03-information-architecture.md#translation-files)).

```
meta
  siteName                    "Keily"
  home.title / home.description
  about.title / about.description
  work.title / work.description
  notFound.title
nav
  about · work · contact · menu · closeMenu · skipToContent
lang
  switchTo                    aria-label for the language switcher
  en · es                     display labels
hero
  headline                    "Hola, soy Keily, y soy fotógrafa." / "Hello, I'm Keily, and I'm a photographer."  (see note below)
  subline
  ctaPrimary                  → scrolls to #contact
  ctaSecondary                → /my-work
  scrollHint
  imageAlt
about
  eyebrow · heading · lead · body[]           (body is a paragraph array)
  portraitAlt · secondaryAlt
  cta                          → /about
  page.title · page.lead · page.body[]
  page.factsHeading · page.facts[]            (label/value pairs, e.g. Based in / Working since)
work
  eyebrow · heading · lead
  cta                          → /my-work
  page.title · page.lead
  filters.all                  gated on open decision #1
  photoCount                   (n: number) => string
contact
  eyebrow · heading · lead
  form.name.label / .placeholder / .error.required / .error.tooShort
  form.email.label / .placeholder / .error.required / .error.invalid
  form.subject.label / .placeholder                       (optional field)
  form.message.label / .placeholder / .error.required / .error.tooShort / .error.tooLong
  form.submit · form.submitting
  form.success.heading / .body / .again
  form.error.heading / .body / .retry
  form.required                aria + visual "required" indicator text
  form.errorSummary            (n: number) => string
  socials.heading · socials.instagram · socials.email
  directEmail                  "Prefer email? …"
lightbox                        gated on open decision #2
  close · previous · next · counter (i, n) => string
footer
  tagline · rights · navHeading · contactHeading
notFound
  heading · body · cta
common
  loading · imageLoading
```

### Note on the hero headline

The brief specifies the exact English string: **"Hello, I'm Keily, and I'm a photographer."** It is stored
as three ordered segments so the display type can break and animate line-by-line without hard-coded `<br>`:

```ts
// es.ts  — default language, the one most visitors see
hero: { headline: ['Hola, soy Keily,', 'y soy', 'fotógrafa.'] }

// en.ts
hero: { headline: ["Hello, I'm Keily,", 'and I’m a', 'photographer.'] }
```

Since Spanish is now the default, **the Spanish headline is the one that matters most** and it is the one
that must be confirmed by Keily — including whether she wants `fotógrafa`, `fotógrafa profesional`, or
something with more of her own voice. See [10-content-checklist.md](./10-content-checklist.md).

The third segment is the one rendered in gold. In both languages that segment is the word "photographer" /
"fotógrafa", which is the intended emphasis — the segmentation is not accidental and must be preserved if
the copy changes.

Typographic apostrophes (`’`) are used in copy, not `'`.

## Site constants — `src/lib/site.ts`

```ts
export const SITE = {
  name: 'Keily',
  url: 'https://TODO-production-domain',
  email: 'TODO@example.com',
  socials: [
    { id: 'instagram', href: 'https://instagram.com/TODO', icon: 'instagram' },
    { id: 'email',     href: 'mailto:TODO@example.com',    icon: 'mail' },
  ],
} as const;
```

The `socials` array is rendered by a single loop in both the contact section and the footer, so adding
Behance, TikTok or LinkedIn later is one array entry plus one icon component — no layout changes.
Labels come from `t.contact.socials[id]`; a social entry with no matching translation key is a type error.

## Placeholder content

No real photographs, copy, or contact details exist yet. The build proceeds against generated placeholders.

### Generator — `scripts/generate-placeholders.mjs`

A Node script using `sharp` that writes deterministic grayscale placeholder JPEGs. It is offline, requires no
network, and produces stable output so builds are reproducible.

Behaviour:
- Reads a manifest array declared at the top of the script (filename, width, height).
- Emits a linear grayscale gradient (dark → mid grey), overlaid with the filename rendered as small text via
  an SVG composite, so each placeholder is visually distinguishable during development.
- Skips any file that already exists, so dropping in a real photograph is never overwritten.
- Writes only to `src/assets/photos/`, `src/assets/`, and `public/`.

Manifest: `hero.jpg` 2400×1600 · `portrait.jpg` 1200×1500 · `about-secondary.jpg` 1800×1200 ·
`og-default.jpg` 1200×630 · 18 gallery photos with mixed orientations —
8 portrait (1600×2000), 7 landscape (2400×1600), 3 square (2000×2000).

### Placeholder copy

`en.ts` and `es.ts` are authored with **plausible, well-written placeholder prose in the correct voice and
approximately the correct length** — not lorem ipsum. Rationale: lorem ipsum hides layout problems (Spanish
length overflow, orphaned words, measure violations) that only surface with realistic text. Every placeholder
string is marked with a trailing `// TODO: copy` comment so the replaceable set is greppable, and
[10-content-checklist.md](./10-content-checklist.md) tracks them.

### Placeholder metadata

18 photo entries authored across the three example series, with `featured: true` on exactly 6 of them, mixed
`tone` values (15 `bw`, 3 `colour`), and real alt text describing the placeholder image. This exercises every
branch of both open gallery-decision options.
