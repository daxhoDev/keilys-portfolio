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

      /**
       * Monochrome or colour. REQUIRED IN PRACTICE — this is what the gallery
       * filters on (decision #1 = D). The default exists only so a half-written
       * entry does not fail the build; every real photo states it explicitly.
       */
      tone: z.enum(['bw', 'colour']).default('bw'),

      /** Named body of work. Unused by the UI. Reserved in case she ever names series. */
      series: z.string().optional(),

      /** Subject tags. Unused by the UI. Free-form, useful for her own bookkeeping. */
      tags: z.array(z.string()).default([]),

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

**`tone` is the only one of the three that the site reads.** Decision #1 resolved to **D — filter by tone**
([09-open-decisions.md](./09-open-decisions.md#1--gallery-organisation-resolved-d-tone)), so `tone` is
load-bearing metadata: a photo tagged `bw` that is actually in colour is a visible bug. `series` and
`tags` stay in the schema, optional and unused — they cost nothing, they keep option A additive if she ever
names bodies of work, and they give her somewhere to record her own groupings in the meantime.

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
tone: bw
series: quiet-rooms      # optional, unused by the UI
tags: [interior, light]  # optional, unused by the UI
featured: true
order: 10
capturedAt: '2024-03'
---
```

The Markdown body is unused. Decision #2 resolved to a lightbox rather than per-photo detail pages, so
nothing renders it — it stays available if a photo ever needs a longer story than `caption` holds.

### Query helpers — `src/lib/photos.ts`

```ts
getAllPhotos(): Promise<Photo[]>              // draft:false, sorted by order then id
getFeaturedPhotos(): Promise<Photo[]>         // featured:true, sorted, sliced to 6
getToneCounts(): Promise<Record<Tone, number>>  // { bw: n, colour: n } — the filter chip counts
```

`draft: true` entries are filtered out in **every** helper, not at the call site, so a draft can never be
counted by a filter chip it does not appear in.

There is no `getPhotosByTone`. The gallery renders **every** photo once and the filter hides non-matching
cards client-side, so filtering costs no re-render and no layout thrash — see
[06-components.md](./06-components.md#galleryfiltersastro).

`src/i18n/series.ts` is **not built.** It only existed for decision #1 = A.

## Standalone images

Not part of the collection; imported directly.

| File | Aspect | Min dimensions | Use |
|---|---|---|---|
| `src/assets/hero.jpg` | 3:2 landscape | 2400 × 1600 | Landing hero background |
| `src/assets/portrait.jpg` | 4:5 portrait | 1200 × 1500 | "About Me" section on `/` and on `/about` |
| `src/assets/about-secondary.jpg` | 3:2 landscape | 1800 × 1200 | Second image on `/about` |
| `public/og-default.jpg` | 1.91:1 | 1200 × 630 | Open Graph / Twitter card |

Alt text for these four lives in the translation files, not in frontmatter.

## Photographs smaller than 2400px

Keily flagged that **some of her photographs do not reach 2400px on the long edge**. That is fine and needs
no re-export on her side, but it changes one rule in the build.

- **Nothing is ever upscaled.** Astro will not generate a variant larger than the source file, so a
  `widths` array containing values above the native width silently produces fewer (or duplicate) sources
  and a misleading `srcset`.
- Every `<Image>` therefore takes its `widths` from a helper rather than a literal:

```ts
// src/lib/images.ts
/** Candidate widths, dropped where they exceed the file, plus the native width as the ceiling. */
export function responsiveWidths(img: ImageMetadata, candidates: number[]): number[] {
  return [...candidates.filter((c) => c < img.width), img.width];
}
```

- **Minimum usable sizes.** Below these the photo visibly softens on a high-DPI screen at the size the
  layout gives it:

| Use | Ideal long edge | Workable floor | Note |
|---|---|---|---|
| Gallery photo | 2400px | **1400px** | Usable below that, but keep it out of the eager-loaded first row |
| Lightbox (same file) | 2400px | 1400px | The lightbox caps at 90vw × 82vh, so 1400px covers most laptops and every phone |
| Hero | 2400 × 1600 | **2000px wide** | Full-bleed at 100vw — the one image where a small file shows. Use the largest she has |
| Portrait | 1200 × 1500 | 1000px wide | |
| Secondary about image | 1800 × 1200 | 1400px wide | |

- A small gallery photo is **not rejected**. It is sorted away from the eager-loaded first three with a
  higher `order`, and noted in the content checklist.
- The build logs a warning listing any gallery photo under 1400px and any hero under 2000px. A warning,
  not an error: shipping her actual photographs matters more than a pixel rule.

## Translation key inventory

The complete set of keys. Both `en.ts` and `es.ts` implement all of them; TypeScript enforces parity.

Keys are listed with their English gloss for readability; the authoritative values are written in Spanish
first (`es.ts` is the source of truth — see
[03-information-architecture.md](./03-information-architecture.md#translation-files)).

```
meta
  siteName                    "Keily Mar Couselo"
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
  filters.label                aria-label for the filter group
  filters.all · filters.bw · filters.colour     "Todas" · "Blanco y negro" · "Color"
  filters.empty · filters.showAll               empty-state message and reset button
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
  socials.heading · socials.email
  socials.instagramGallery · socials.instagramPersonal   two accounts, distinct labels
  directEmail                  "Prefer email? …"
lightbox
  label                        aria-label for the dialog itself
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

**Keily approved the Spanish headline as proposed** — "Hola, soy Keily, y soy fotógrafa.", no "profesional".
It is final copy, not a placeholder.

The third segment is the accented one. In both languages it is the word "fotógrafa" / "photographer", which
is the intended emphasis — the segmentation is not accidental and must be preserved if the copy ever changes.

She also asked for that word to be **grey or silver rather than gold**. It renders `mustang-soft` with a 1px
`mustang` underline, for the reason given in
[12-copy-from-keily.md](./12-copy-from-keily.md#hero-thero): plain `mustang` on a `bone` headline would
make the emphasised word darker than its neighbours.

Typographic apostrophes (`’`) are used in copy, not `'`.

## Site constants — `src/lib/site.ts`

```ts
export const SITE = {
  /** Full name. The header wordmark uses the shorter 'Keily Mar' — see 12-copy-from-keily.md. */
  name: 'Keily Mar Couselo',
  wordmark: 'Keily Mar',
  /** Temporary Vercel URL. A custom domain comes much later; this is the only line that changes. */
  url: 'https://keilymargallery-sage.vercel.app',
  /** false while on *.vercel.app: noindex + Disallow + no sitemap. See 08-…#indexing-is-off-until-the-custom-domain. */
  indexable: false,
  email: 'kylieemar0500@gmail.com',
  socials: [
    { id: 'instagramGallery',  href: 'https://instagram.com/kyliemargallery', icon: 'instagram' },
    { id: 'instagramPersonal', href: 'https://instagram.com/_kyliemar_',      icon: 'instagram' },
    { id: 'email',             href: 'mailto:kylieemar0500@gmail.com',        icon: 'mail' },
  ],
} as const;
```

The `socials` array is rendered by a single loop in both the contact section and the footer, so adding
Behance, TikTok or LinkedIn later is one array entry plus one icon component — no layout changes.
Labels come from `t.contact.socials[id]`; a social entry with no matching translation key is a type error.

**Two Instagram accounts, deliberately ordered.** `kyliemargallery` is the work account and comes first;
`_kyliemar_` is personal. They share the `instagram` icon, so each **must** carry its own label —
"Instagram · galería" / "Instagram · personal" — or a screen reader announces two identical links. The
`id`s differ precisely so the type system forces two distinct translation keys.

**There is no `TODO` left in this file.** The site launches on the Vercel URL, which makes canonical,
`hreflang` and absolute OG URLs correct from day one rather than merely deferred; `indexable: false` keeps
that URL out of the index until a real domain replaces it
([decision 5.2](./09-open-decisions.md#5--delivery--launch-decisions)).

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
`og-default.jpg` 1200×630 · **20 gallery photos** (Keily is sending 20) with mixed orientations —
9 portrait (1600×2000), 8 landscape (2400×1600), 3 square (2000×2000). Two of the twenty are generated
**undersized on purpose** (1100px and 1300px long edge) so the `responsiveWidths` clamp and the
under-1400px build warning are exercised in development rather than discovered when her real files arrive.

### Placeholder copy

`en.ts` and `es.ts` are authored with **plausible, well-written placeholder prose in the correct voice and
approximately the correct length** — not lorem ipsum. Rationale: lorem ipsum hides layout problems (Spanish
length overflow, orphaned words, measure violations) that only surface with realistic text. Every placeholder
string is marked with a trailing `// TODO: copy` comment so the replaceable set is greppable, and
[10-content-checklist.md](./10-content-checklist.md) tracks them.

### Placeholder metadata

20 photo entries with `featured: true` on exactly 6, real alt text describing the placeholder image, and
`tone` split **16 `bw` / 4 `colour`** — roughly the balance her own description implies, and enough that
both filter chips have content and neither empty state is theoretical.

Four of the entries carry a `title` and `caption` and the rest do not, so the lightbox is developed against
both the captioned and the bare case. Two carry a `series` value even though nothing reads it, to prove the
unused field does not break the build.
