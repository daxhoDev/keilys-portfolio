# 10 · Content checklist

Keily has answered the questionnaire ([preguntas-para-keily.md](./preguntas-para-keily.md)) and sent all of
her Spanish copy ([12-copy-from-keily.md](./12-copy-from-keily.md)). Everything else was decided on the build
side ([09-open-decisions.md §5](./09-open-decisions.md#5--delivery--launch-decisions)).

**What is left is the photographs.** They are the only outstanding item that nobody but Keily can produce,
and they block launch on their own. The site is built against generated placeholders until they arrive —
they drop in at [Phase 9](./11-implementation-plan.md#phase-9--real-content-swap), which is not on the
critical path.

## Status at a glance

| Area | Status |
|---|---|
| Gallery organisation, click behaviour, palette, name, favicon | ✅ Decided |
| Spanish copy — hero, about (short + long), section lines, footer | ✅ Delivered |
| Email, Instagram (×2) | ✅ Delivered |
| Facts list values | ✅ Ships as proposed, flagged for her confirmation |
| Interface microcopy (~40 strings) | ✅ Ours to write, developer approves |
| English translation | ✅ Ours, ships without her review |
| URL | ✅ `keilymargallery-sage.vercel.app`, `noindex` until a custom domain |
| Contact form delivery | ✅ Stub at launch, email visible beside it |
| **The photographs** | ✅ **27 delivered** — ingested into `src/assets/photos/` |
| Tone ×27 + the featured 6 | ✅ Tone from her two folders (17 `bw` / 10 `colour`); featured 6 chosen |
| Alt text ×27 + titles + years | ⚠️ **20 of 27 in her words**; the 6 featured, `img-4482` and 3 fragment alts are our proposals, flagged in [fichas-de-fotos.md](./fichas-de-fotos.md) and awaiting her yes/no |
| English translation of the photo metadata | ✅ Ours, ships without her review — already written into the entries |
| Hero image | ✅ Delivered and in place |
| **Portrait / secondary / OG images** | ✗ Not sent — placeholders still in `src/assets/` |

---

## ✅ Received: the photographs

She sent **27**, which sits inside the 18–30 guide. They arrived in two folders — *blanco y negro* (17)
and *a color* (10) — which is where `tone` comes from. All 27 are ingested into `src/assets/photos/` as
`img-<número>.jpg`, EXIF-rotated, metadata stripped, capped at 2400px on the long edge.
**The smallest is 1681px on the long edge, so nothing falls under the 1400px floor** and the
undersized-image warning stays silent.

| Item | Count | Spec |
|---|---|---|
| Gallery photographs ✅ | 27 | Longest edge 2400px where possible, JPEG quality 85, sRGB, EXIF stripped. Mixed orientations welcome — the masonry is built for it and nothing is cropped |
| Hero image ✅ | 1 | Delivered — 2400 × 1350. Landscape. Must work with text over its lower-left third; a calm, darker lower-left works best. The scrim guarantees legibility, but a busy bottom-left still fights the headline. **This is the one image where a small file shows** — send the largest available, ideally ≥ 2000px wide |
| Portrait of Keily ✗ | 1 | Portrait orientation, 4:5, ideally ≥ 1200 × 1500 |
| Secondary about image ✗ | 1 | Landscape, 3:2, ideally ≥ 1800 × 1200 |
| Open Graph image ✗ | 1 | 1200 × 630. Can be a crop of a strong photograph |

### Photographs under 2400px — she flagged this, and it is fine

Nothing needs re-shooting or up-rezzing. The build **never upscales**: `widths` are clamped to each file's
native size, so a smaller photo simply serves fewer variants
([04-content-model.md](./04-content-model.md#photographs-smaller-than-2400px)).

- **1400px on the long edge** is the comfortable floor for a gallery photo. Below that it stays in the
  gallery but is kept out of the first row, where images are largest and load eagerly.
- The build prints a warning listing anything under the floor. A warning, not an error.
- **Never enlarge a file in an editor to reach 2400px.** Upscaling invents detail and looks worse than the
  honest smaller file, and it defeats the clamp.

### sRGB — her other question

sRGB is the colour space the whole web assumes. A file exported in Adobe RGB or ProPhoto renders with
flatter, greyer tones in a browser, which on black-and-white work shows up as muddy midtones. Where the
setting lives:

| Program | Where |
|---|---|
| Lightroom / Camera Raw | Export → *File Settings* → **Color Space: sRGB** |
| Photoshop | *File → Export → Export As…* → tick **Convert to sRGB** (or *Save for Web (Legacy)*, same checkbox) |
| Capture One | Export recipe → *Basic* → **ICC Profile: sRGB** |
| Snapseed / Lightroom Mobile / any phone app | Already sRGB — nothing to do |
| Straight from the camera (JPEG) | Menu → *Color Space* → **sRGB**, not Adobe RGB |

If a file does come in tagged something else it is **not a problem** — Sharp converts it to sRGB during the
build. Setting it at export just means what she sees is exactly what visitors get.

## ✗ Blocking: per-photograph metadata

For **each** of the 20, in **both languages** (Spanish first):

- `alt` — **required.** One sentence describing what the photograph shows, for someone who cannot see it.
  Content, not authorship: *"Una ventana desnuda proyecta un rectángulo de luz sobre un suelo de madera
  vacío"*, not *"Foto de Keily"*. She confirmed this format works for her.
- `tone` — **required, and now load-bearing.** `bw` or `colour` is what the gallery filters on
  ([decision #1 = D](./09-open-decisions.md#1--gallery-organisation-resolved-d-tone)). A photo filed under
  the wrong tone is a visible bug, and **if she sends only black-and-white work the filter row disappears
  entirely** — worth telling her, since she chose the filter partly to show the colour work exists.
- `featured` — **exactly 6.** She has not picked them yet ("más adelante"). The build fails with fewer.
- `title` — optional, shown on hover and in the lightbox.
- `caption` — optional, longer note or story; lightbox only.
- `capturedAt` — optional, `YYYY` or `YYYY-MM`.
- `series` / `tags` — optional and **unread by the site**. Only worth filling if she wants the record.

## ✅ Handled: English

Every string in [12-copy-from-keily.md](./12-copy-from-keily.md) arrived in Spanish only, including the
~560-word biography. **We translate it, and it ships without her review**
([decision 5.3](./09-open-decisions.md#5--delivery--launch-decisions)) — so English blocks nothing and waits
on nobody.

It is not a machine-translation job. The biography carries a voice, and with no review gate behind it, a
flattened English version would ship unnoticed. Treat the English copy as authored work, and give it a
deliberate second pass in Phase 8 alongside the audit.

`es.ts` is the type source of truth, so a missing **English** key is the build error.

## ✅ Handled: the URL

The site launches at `https://keilymargallery-sage.vercel.app` — the Vercel project name matches her work
Instagram handle. A custom domain comes much later, and replacing it is one constant in `src/lib/site.ts`.

While it is on `*.vercel.app`, `SITE.indexable = false`: `noindex` on every page, `Disallow: /` in
`robots.txt`, no sitemap. **Flipping that to `true` is a launch step for the real domain**, and it is on the
Phase 8 checklist rather than buried in code.

## ✅ Ships as proposed: the facts list

She left question 11 blank, which is read as accepting the proposal, and it ships:
Holguín · 2020 · *Calle, mar, animales, eventos culturales, personas* · Español e Inglés ·
Canon PowerShot SX400 IS. **Still worth one confirmation from her before launch** — the values look like
hers rather than ours, but nobody has said so out loud.

## ✅ Ours to write, developer approves

She supplied prose, not interface labels. These are written by us at production quality and reviewed in the
build by the developer ([decision 5.4](./09-open-decisions.md#5--delivery--launch-decisions)) — they do
**not** go back to Keily:

| Key | Note |
|---|---|
| `about.eyebrow` · `about.heading` · `about.cta` | Landing About block |
| `work.eyebrow` · `work.heading` · `work.cta` | Landing Work block |
| `contact.eyebrow` · `contact.heading` | Contact block |
| `about.page.title` · `about.page.lead` | About page header |
| `work.page.title` | Work page header |
| `hero.ctaPrimary` · `hero.ctaSecondary` · `hero.scrollHint` | Hero controls |
| All form labels, placeholders, validation, success and error messages | ~20 short strings |
| `footer.rights` · `footer.navHeading` · `footer.contactHeading` | Footer |
| `notFound.*` · all `meta.title` / `meta.description` | 404 and metadata |
| `lightbox.*` · `work.filters.*` | Now needed — both features are being built |

Two strings she *did* supply were edited, each by the smallest possible amount
([decision 5.8](./09-open-decisions.md#5--delivery--launch-decisions)): `Explora` → `Exploro` in the hero
subline, and `;` → `:` plus a final stop in the footer tagline. Both are disclosed to her in
[pendientes-para-keily.md](./pendientes-para-keily.md) and either reverts in one string.

## ✅ Settled

- Palette: black background, *gris mustang* `#7E7D7B` details, no gold.
- Gallery: filtered by tone. Clicking a photo opens a full-screen lightbox.
- Name: **Keily Mar Couselo** (header wordmark "Keily Mar").
- Favicon: a black italic "K" on a light ground — inverted from the site, deliberately.
- Contact: `kylieemar0500@gmail.com` as a plain visible `mailto:`; both Instagram accounts, work first.
- Hero headline approved as proposed.
- **The contact form ships as a stub** — it validates and confirms but sends nothing, and her email sits
  beside it. She must be told this in as many words at handover; it is the one way this site could quietly
  lose her a message.

## Not needed yet

Deferred with their features, listed so nobody chases them: **services and pricing, a blog, and print
sales** — all three requested for a later phase
([12-copy-from-keily.md](./12-copy-from-keily.md#later-phases-she-asked-for)) — plus testimonials and
booking, which she did not ask for, and the privacy notice, which becomes mandatory the moment the contact
form starts actually transmitting data.

## Placeholder inventory

Until the photographs arrive, the repo contains:

- 24 generated grayscale placeholder JPEGs (`npm run placeholders`, deterministic, offline, never overwrites
  a real file). Two are deliberately undersized to exercise the no-upscale path.
- 20 photo entries with realistic alt text, 6 `featured`, 16 `bw` / 4 `colour`.
- `es.ts` carrying **Keily's real copy** where she has supplied it, our own production-quality strings for
  the interface, and placeholder prose only where neither exists yet.
- `en.ts` translated from `es.ts` as the Spanish firms up.
- No `TODO`s in `src/lib/site.ts` — the URL is real.

**Launch gate:** `grep -rn "TODO" src/ astro.config.mjs` returns nothing, and the 20 photographs are in.
