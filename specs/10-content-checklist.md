# 10 · Content checklist

Nothing real exists yet. The site is built against generated placeholders so development is never blocked,
but **the site cannot launch until every item below is supplied.** Each item names who provides it and where
it goes.

## Blocking for launch

### Identity & contact

| Item | Goes in | Notes |
|---|---|---|
| Production domain | `astro.config.mjs` `site`, `SITE.url` | Needed for canonical URLs, `hreflang`, sitemap, and absolute OG image URLs. Placeholder `TODO-production-domain` fails nothing at build time but produces wrong metadata |
| Contact email address | `SITE.email` | Used by the `mailto:` links and the `<noscript>` fallback |
| Instagram handle / URL | `SITE.socials` | |
| Any additional socials | `SITE.socials` | One array entry + one icon component each. Behance, TikTok, Pinterest, LinkedIn are all trivial to add |

### Photographs

| Item | Count | Spec |
|---|---|---|
| Gallery photographs | 18–30 | Longest edge **2400px**, JPEG quality 85, sRGB, EXIF stripped. Mixed orientations welcome — the masonry layout is built for it and nothing is cropped |
| Hero image | 1 | Landscape, min 2400 × 1600. Must work with text over its lower-left third; something with a calm, darker lower area works best. The gradient scrim guarantees legibility but a busy bottom-left still fights the headline |
| Portrait of Keily | 1 | Portrait orientation, 4:5, min 1200 × 1500. Used in the About section on `/` and on `/about` |
| Secondary about image | 1 | Landscape, 3:2, min 1800 × 1200 |
| Open Graph image | 1 | 1200 × 630. Can be a crop of a strong photograph, optionally with the wordmark |

**Do not commit camera originals.** A 40MB RAW export in the repo is a build and clone problem. Export at the
sizes above; Astro handles every responsive variant from there.

### Per-photograph metadata

For **each** photograph, in **both Spanish and English** (Spanish first — it is the default language):

- `alt` — **required.** A description of what the photograph shows, for someone who cannot see it. One
  sentence. Describe content, not authorship: "A bare window casting a hard rectangle of light across an
  empty wooden floor", not "Photo by Keily".
- `title` — optional. Shown on hover and in the lightbox.
- `caption` — optional. A longer note or story; lightbox only.
- `series` / `tags` / `tone` — see [open decision #1](./09-open-decisions.md#1--gallery-organisation).
  Supplying all three costs little and keeps every option open.
- `featured` — **exactly 6** photographs must be marked `featured: true` for the landing page. The build
  fails if fewer.
- `capturedAt` — optional, `YYYY` or `YYYY-MM`.

### Copy — Spanish and English

Every string below currently holds well-written placeholder prose in the right voice and roughly the right
length (marked `// TODO: copy` in the translation files, so `grep -rn "TODO: copy" src/i18n` lists exactly
what remains).

| Copy | Length guide |
|---|---|
| Hero headline | **Spanish is the one that matters** (default language). Proposed: *"Hola, soy Keily, y soy fotógrafa."* Needs Keily's confirmation — including whether she prefers *fotógrafa*, *fotógrafa profesional*, or something more her own. English is fixed by the brief: *"Hello, I'm Keily, and I'm a photographer."* |
| Hero subline | 1 sentence, ≤ 140 chars |
| Hero CTA labels | 2 short labels |
| About (landing) — heading, lead, 2 paragraphs | ~120 words total |
| About (page) — title, lead, 4–6 paragraphs | 350–600 words |
| About facts list | 4–6 label/value rows. Suggested: Based in · Working since · Shoots · Speaks · Equipment. Keily confirms which rows and their values |
| My Work (landing) — heading + lead | ≤ 40 words |
| My Work (page) — title + lead | ≤ 60 words |
| Contact — heading + lead | ≤ 40 words |
| Form labels, placeholders, all validation messages | ~20 short strings, both languages |
| Form success and error messages | 2 short blocks |
| Footer tagline + rights line | 2 short strings |
| 404 heading + body | 2 short strings, both languages shown side by side |
| Meta titles + descriptions | 3 pages × 2 languages. Descriptions 140–160 chars |
| Series names, if [decision #1](./09-open-decisions.md#1--gallery-organisation) is A | 3–5 names, both languages |

**Spanish is written first, and English is not a machine translation of it.** Copy is authored natively in
Spanish (it is the default language and `es.ts` is the type source of truth), then translated into English
by a person. The layout is checked at 320px in **Spanish**, which runs 15–25% longer than English and is
therefore the harder case — which is convenient, because it is also the default.

### Favicon set

`favicon.svg`, `favicon-96.png`, `apple-touch-icon.png` (180 × 180). A "K" set in italic Playfair on `ink`
is a reasonable default if no mark exists; confirm with Keily.

## Blocking only if the relevant decision goes that way

| Item | Needed if |
|---|---|
| 3–5 named bodies of work + which photos belong to each | [Decision #1](./09-open-decisions.md#1--gallery-organisation) = A (series) |
| Subject categories per photo | Decision #1 = B (categories) |
| Lightbox UI strings (close, previous, next, counter) | [Decision #2](./09-open-decisions.md#2--photo-click-behaviour) = A or B |
| A story paragraph per photo, both languages | Decision #2 = D (detail pages) |

## Not needed yet

Deferred with their features, listed so nobody chases them: service descriptions and pricing, client
testimonials, privacy notice and cookie copy (needed when the contact form starts actually transmitting data),
booking or availability information, print/licensing terms, analytics account.

## Placeholder inventory

Until the above arrives, the repo contains:

- 22 generated grayscale placeholder JPEGs (`npm run placeholders`, deterministic, offline, never overwrites
  a real file that is already in place).
- 18 photo content entries with realistic alt text, spread across 3 example series, 6 marked `featured`,
  15 `bw` / 3 `colour` — enough to exercise every branch of both open gallery decisions.
- Full `en.ts` and `es.ts` with realistic placeholder prose at production-realistic lengths.
- `TODO-production-domain` and `TODO@example.com` in `src/lib/site.ts`.

**Launch gate:** `grep -rn "TODO" src/ astro.config.mjs` returns nothing.
