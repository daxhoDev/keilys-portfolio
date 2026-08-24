# 09 · Open decisions

**All three decisions are resolved.** Nothing in this specification is blocked.

Decisions #1 and #2 were answered by Keily in
[preguntas-para-keily.md](./preguntas-para-keily.md); #3 was decided during specification. Each is kept
below with the options that were considered, so the reasoning behind the answer survives.

| # | Question | Answer | Blocks | Status |
|---|---|---|---|---|
| 1 | How is the gallery organised / filtered? | **D — tone: Todas · Blanco y negro · Color** | `GalleryFilters`, work page header | ✅ **Resolved** |
| 2 | What happens when a visitor clicks a photo? | **A — custom lightbox, no library** | `PhotoCard.interaction`, `Lightbox` | ✅ **Resolved** |
| 3 | i18n URL scheme | **Spanish at the root, English under `/en`** | Page file locations, `ROUTES` | ✅ **Resolved** |

A fourth question — a real backend for the contact form — has since been answered too
([#4](#4--contact-form-delivery-resolved-stub-at-launch)), and the delivery decisions taken alongside it are
recorded in [§5](#5--delivery--launch-decisions).

---

## 1 · Gallery organisation (resolved: D, tone)

**Keily's answer: D.** The gallery is filtered by tone — monochrome versus colour.

### The chips

Three controls, "Todas" first and active by default:

| Slug | ES | EN | Source |
|---|---|---|---|
| `all` | Todas | All | — (no filter) |
| `bw` | Blanco y negro | Black & white | `tone: 'bw'` |
| `colour` | Color | Colour | `tone: 'colour'` |

The questionnaire offered D as two chips; it ships as three, with an explicit "Todas" default. Without it
the initial state has to be either "one tone pre-selected" (which hides half her work on arrival) or "no
chip active" (which reads as broken). This matches the `GalleryFilters` spec in
[06-components.md](./06-components.md) and the "All first and active by default" rule in
[05-pages-and-sections.md](./05-pages-and-sections.md#my-work).

### Why this is a good fit for her, in her own terms

Her long biography makes the split load-bearing rather than incidental: black and white is where she
"despoja la realidad del ruido cromático", while her colour work is a deliberate, separate register — cold
tones, "azules, verdes y grises… melancólica y poética". The filter is therefore not sorting by a surface
property; it separates two intentions. It also costs her no curatorial naming, which was the main risk of
option A.

### Consequences

- `tone` on the photo schema is now **load-bearing metadata**, not one of three speculative filter keys.
  Every photo must carry a correct `tone` — see [04-content-model.md](./04-content-model.md).
- `series` stays in the schema as optional and unused. It costs nothing, and if she ever names bodies of
  work, option A becomes additive rather than a migration. `src/i18n/series.ts` is **not** built now.
- `tags` likewise stays optional and unused.
- The active filter syncs to `?filter=bw` / `?filter=colour` so a filtered view is linkable; `all` writes no
  param. Unknown slugs fall back to `all`.

### The options as they were considered

| Option | What the visitor sees | Cost | Trade-off |
|---|---|---|---|
| **A · Series / collections** | Chips of named bodies of work: *Todas · Habitaciones vacías · Luz de calle · La costa* | +`GalleryFilters`, +`series.ts`, ~0.5 day | Reads as an artist's practice. Requires Keily to name and group her work — curatorial effort only she can do |
| **B · Subject categories** | Chips by subject: *Todas · Retrato · Calle · Naturaleza · Eventos* | Same as A, ~0.5 day | Instantly understandable to a client scanning for a service. Slices a cohesive body of work into buckets that may not mean much |
| **C · One continuous stream** | No filters, a single curated masonry flow | Zero | Purest presentation, least maintenance. Becomes hard to navigate past ~60 photos |
| **D · Tone: B&W / colour** ✅ | *Todas · Blanco y negro · Color* | ~0.5 day | **Chosen.** Honest to how her work actually divides, and needs no naming. Filters on something partly visible at a glance — acceptable, because the two tones are two different intentions in her practice |

---

## 2 · Photo click behaviour (resolved: A, custom lightbox)

**Keily's answer: A.** Clicking a photograph opens it full-screen over a dark overlay, with previous/next
navigation by arrows or swipe.

`PhotoCard` ships with `interaction="lightbox"` everywhere it is used — both the featured grid on `/` and
the full gallery. ~3KB of JavaScript, no library, loaded only on pages that render a gallery.

### The options as they were considered

| Option | Cost | Trade-off |
|---|---|---|
| **A · Custom lightbox** (vanilla, no library) ✅ | ~1 day including a11y | **Chosen.** Visitors can see the work large — the single most valuable thing on a photography site. ~3KB JS. Full modal accessibility is the real work, and it is specified below |
| **B · PhotoSwipe** | ~0.3 day | Pinch-zoom and battle-tested a11y, but ~40KB JS — more than the entire budget for `/` — and a dependency in an otherwise dependency-free build |
| **C · Not clickable** | Zero | Fastest, zero JS. Nobody ever sees a photograph larger than a grid thumbnail |
| **D · Detail page per photo** | ~1 day | A real URL per photo, indexable and shareable. But it needs per-photo copy in two languages and turns browsing into navigation |

### Build spec for the Lightbox

Authoritative. Built in Phase 5; every point below is an acceptance criterion.

- **Trigger:** `PhotoCard` renders a `<button>` wrapping the figure, `aria-haspopup="dialog"`, accessible
  name = the photo's localised `title`, or its `alt` if untitled.
- **Dialog:** a single `<div role="dialog" aria-modal="true" aria-label={t.lightbox.label}>` appended once to
  the page, not one per photo. Level-3 surface: `ink` at 96% + `backdrop-blur-sm`.
- **Image:** `<Image>` at `widths={[900, 1400, 2000]}` **clamped to the file's native width** (see
  [04-content-model.md](./04-content-model.md#photographs-smaller-than-2400px)), `sizes="90vw"`,
  `object-fit: contain`, capped at `90vw × 82vh` so the caption always has room. Never upscaled.
- **Chrome:** close button top-right (44×44, `mist` → `bone` on hover); prev/next buttons vertically centred
  at each edge on `md+`, and as a bottom bar on mobile; counter `t.lightbox.counter(i, n)` bottom-centre;
  the photo's `title` and `caption` bottom-left, `body-sm`, `mist`. Accent text on this surface uses
  `mustang-soft`, never `mustang` — the overlay is a level-3 surface.
- **Keyboard:** `Esc` closes · `←`/`→` navigate · `Tab` cycles within the dialog only (focus trap) · focus
  moves to the close button on open · focus returns to the originating thumbnail on close.
- **Touch:** horizontal swipe navigates (threshold 50px), vertical swipe-down closes. Pointer events, no
  gesture library.
- **Page behind:** `inert` + scroll locked with scrollbar-width compensation so the page does not shift.
- **Motion:** overlay fades 240ms; the image scales `0.96 → 1` with a 240ms fade. Under reduced motion,
  opacity only, no scale.
- **Announcement:** an `aria-live="polite"` region announces the counter and title on each navigation.
- **Preloading:** the next and previous full-size images are prefetched once the lightbox opens.
- **Filtering interaction:** when a tone filter is active, the lightbox navigates **within the filtered
  set** only, and the counter reflects that set. Changing the filter while the lightbox is open is not
  possible (the page behind is `inert`), so no reconciliation is needed.
- **No URL change.** The lightbox does not push history, so `Esc` and browser-back behave predictably.
  (A shareable per-photo URL would have been option D, not a bolt-on to A.)

---

## 3 · i18n URL scheme (resolved)

**Decision: Spanish is the default language, at the root. English is prefixed under `/en`.**

| Page | Spanish (default) | English |
|---|---|---|
| Landing | `/` | `/en` |
| About | `/sobre-mi` | `/en/about` |
| Work | `/mi-trabajo` | `/en/my-work` |

### Consequences, all already applied to this spec

- `DEFAULT_LANG = 'es'`; `LANGS` is ordered `['es', 'en']`.
- **`es.ts` is the source of truth for the dictionary type**, so a key missing from *English* is now the
  build error. Copy is authored in Spanish and translated into English — which matches how Keily actually
  wrote it: everything in [12-copy-from-keily.md](./12-copy-from-keily.md) arrived in Spanish.
- `hreflang="x-default"` points at the Spanish URL.
- `og:locale` defaults to `es_ES`; the sitemap's `defaultLocale` is `es`.
- The 404 page renders Spanish first, and the document's root `lang` is `es`.
- The language switcher reads `ES / EN`, default first.
- **No redirect anywhere.** `/` *is* the Spanish homepage. This is the one meaningful advantage over the
  symmetric `/en` + `/es` scheme, which would have needed a redirect hop on the bare domain.

### Note on the brief

The original brief listed `/about` and `/my-work` as the page paths. Those are now the **English** URLs;
the Spanish equivalents at the root are `/sobre-mi` and `/mi-trabajo`. This follows directly from Spanish
being the default and slugs being translated, both of which are deliberate decisions — flagging it only so
the divergence from the brief's literal wording is on the record and not a surprise later.

---

## 4 · Contact form delivery (resolved: stub at launch)

**Decision: launch with the documented stub.** The form validates, shows every state, and confirms — it
does not deliver mail yet.

Keily did not answer this one; it was decided on the build side.

- Her email address is **visible beside the form as a plain `mailto:` link** (see
  [§5](#5--delivery--launch-decisions)), so in v1 that is the working contact path and it must be the least
  fragile thing on the page.
- No privacy notice is required, because nothing personal is transmitted. That changes the day delivery is
  switched on — the notice ships *with* the backend, not after it.
- Switching it on later is one function body plus one environment variable:
  [`submitContact`](./05-pages-and-sections.md#the-submit-seam-srclibcontactts). Validation, states,
  accessibility, honeypot and i18n are production-ready as built and need no changes.

**This must be said out loud to Keily at handover.** A form that looks like it works and silently does not
is the single most damaging thing that could ship here — it was flagged in the questionnaire and is repeated
in [pendientes-para-keily.md](./pendientes-para-keily.md).

---

## 5 · Delivery & launch decisions

Not design decisions — build and launch choices taken with the developer rather than with Keily. Recorded
here because several of them are visible to visitors.

| # | Question | Decision | Consequence |
|---|---|---|---|
| 5.1 | Domain | **None for now** — the site lives at `https://keilymargallery.vercel.app`, matching her work Instagram handle. A custom domain comes much later | `SITE.url` holds the Vercel URL, so canonical, `hreflang`, sitemap and OG URLs are all correct on day one. Moving later is one constant plus 301s |
| 5.2 | Search indexing | **`noindex` while on `*.vercel.app`** | `SITE.indexable = false` drives `<meta name="robots" content="noindex, nofollow">`, a `Disallow: /` `robots.txt`, and omission of the sitemap. Flipped to `true` with the custom domain, so the vercel.app URL never has to be de-indexed or redirected for SEO |
| 5.3 | English copy | **We translate; it ships without Keily's review** | English is no longer a launch blocker and no longer waits on her. The biography is translated as real prose, not literally — its register is the thing most at risk, and nobody downstream will catch a mistake, so it gets a second pass before launch |
| 5.4 | Interface microcopy | **We write it; the developer approves** | The ~40 UI strings (eyebrows, headings, CTAs, form labels, validation, 404, meta) are written in Spanish at production quality and reviewed in the build. They do **not** go back to Keily |
| 5.5 | Email display | **Plain, visible `mailto:`** — no JS obfuscation | Works with JavaScript off, which is exactly the case the fallback exists for. Accepted cost: the address is scrapeable |
| 5.6 | Instagram | **Both accounts, work first** | `@kyliemargallery` then `@_kyliemar_`, separately labelled so a screen reader never announces two identical links |
| 5.7 | Facts list | **Ships as proposed**, flagged for her confirmation | Holguín · 2020 · subjects · Español e Inglés · Canon PowerShot SX400 IS. She left the question blank; the values read as hers, not ours |
| 5.8 | Two edits to her copy | **Applied** — `Explora` → `Exploro` in the hero subline; `;` → `:` and a final stop in the footer tagline | The smallest possible corrections: one verb, one mark. Everything else is verbatim. Both are disclosed to her in [pendientes-para-keily.md](./pendientes-para-keily.md), and either reverts in one string |
| 5.9 | Header wordmark | **"Keily Mar"** | Full name everywhere else. See [12-copy-from-keily.md](./12-copy-from-keily.md#identity-and-contact-site) |
