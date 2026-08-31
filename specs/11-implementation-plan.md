# 11 · Implementation plan

From an empty repository to a live site, in eleven phases.

Every design decision is closed ([09-open-decisions.md](./09-open-decisions.md)), so **no phase is blocked by
a question**. One thing gates *launch* and nothing else: Keily's 20 photographs
([10-content-checklist.md](./10-content-checklist.md)). Phases 0–8 are built against generated placeholders
and do not wait for them.

Estimates are working days for one developer, and they describe focused build time, not calendar time.

**Every phase ships with tests.** A phase is done when its acceptance criteria are proved by something that
runs, not when it renders — see [13-testing.md](./13-testing.md).

| # | Phase | Days | Gated on |
|---|---|---|---|
| 0 | [Repo, pipeline & first deploy](#phase-0--repo-pipeline--first-deploy) | 0.25 | — |
| 1 | [Foundation](#phase-1--foundation) | 0.5 | 0 |
| 2 | [i18n, routing & copy](#phase-2--i18n-routing--copy) | 1.5 | 1 |
| 3 | [Chrome](#phase-3--chrome) | 1 | 2 |
| 4 | [Landing page](#phase-4--landing-page) | 2 | 3 |
| 5 | [Gallery, filters & lightbox](#phase-5--gallery-filters--lightbox) | 3 | 3 |
| 6 | [Contact form](#phase-6--contact-form) | 1.5 | 3 |
| 7 | [About page & motion](#phase-7--about-page--motion) | 1.5 | 3 |
| 8 | [Polish & audit](#phase-8--polish--audit) | 1 | 4–7 |
| 9 | [Real content swap](#phase-9--real-content-swap) | 1 | **Keily's photographs** |
| 10 | [Launch](#phase-10--launch) | 0.25 | 8, 9 |

**~13.5 days** to a live site with her real photographs in it. **~12.5** of those do not depend on her.

The browser suite runs as of Phase 8: 116 Playwright assertions across desktop and mobile, including axe on
all seven routes. The Phase 3 criteria that depended on it — focus trap, focus return, `Esc`, scroll lock,
`inert` — are met and verified, not merely written.

---

## Phase 0 · Repo, pipeline & first deploy

**0.25 days.** Get a broken build to fail loudly on day one rather than on day ten.

- `.gitignore`, `.nvmrc` (Node 22), `package.json` `engines: >=20.11`.
- Minimal Astro 5 scaffold — static output, strict TypeScript, the `~/*` alias, `site` set to the Vercel
  URL — plus one placeholder page carrying `noindex`. **Not** Tailwind, tokens or fonts; those are Phase 1.
- Create the Vercel project **`keilymargallery`** from the GitHub repo. Framework preset: Astro.

### Branching

All build work happens on a long-lived **`development`** branch. `master` keeps only the initial commit
until launch.

| | |
|---|---|
| Vercel Production Branch | `master` — so `keilymargallery.vercel.app` stays empty during the build |
| The URL to actually use | the branch alias, `keilymargallery-git-development-<scope>.vercel.app` |
| At launch ([Phase 10](#phase-10--launch)) | merge `development` → `master`; the production URL fills in |

Every deploy during the build is a preview deploy, and previews are password-protectable in Vercel if the
work-in-progress should not be publicly readable.

**Note on metadata in previews:** canonical, `og:url` and `hreflang` are built from `SITE.url`, so on a
preview they point at `keilymargallery.vercel.app` rather than at the alias being viewed. That is correct —
they must describe the final location — and it is harmless while everything is `noindex`.

**Done when:** a push to `development` produces a green deploy and a reachable preview URL, and a
deliberately broken commit turns it red.

**Why first:** every later phase gets a shareable URL for free, and CI catches the class of failure — a
build that works locally and not on Vercel — while the surface area is one file instead of forty.

---

## Phase 1 · Foundation

**0.5 days.** The token layer everything else is expressed in.

- Scaffold Astro 5, `output: 'static'`, `site: 'https://keilymargallery.vercel.app'`.
- Tailwind v4 via `@tailwindcss/vite`; `src/styles/global.css` with the **full `@theme` token set** from
  [02-design-system.md](./02-design-system.md#globalcss-shape) — the black/mustang palette, type scale,
  easings, durations.
- Fonts via Fontsource: Inter Variable, Playfair Display **italic only** (400/500/600), `latin` +
  `latin-ext`.
- TypeScript paths (`~/*` → `src/*`), Prettier, `vercel.json` headers, npm scripts.
- `src/lib/site.ts` — real values: name, wordmark, email, both Instagram accounts, `url`,
  `indexable: false`.
- `src/lib/images.ts` — `responsiveWidths()`. Written now because every `<Image>` in every later phase
  depends on it ([04-content-model.md](./04-content-model.md#photographs-smaller-than-2400px)).
- `scripts/generate-placeholders.mjs` + `npm run placeholders`.

**Done when:** `npm run build` passes with `astro check` clean · a scratch page renders body text in Inter
and a heading in italic Playfair · every colour token resolves as a Tailwind utility and `bg-ink` is
`#000000` · `npm run placeholders` writes all 24 files, two of them deliberately undersized, and is a no-op
on a second run · `responsiveWidths()` never returns a width larger than its source.

**Watch for:** a non-italic Playfair face sneaking into the bundle. It is never used, and shipping it is a
silent 30KB.

---

## Phase 2 · i18n, routing & copy

**1.5 days.** The largest copy phase, and the one where Keily's actual words go in.

- `src/i18n/`: `routes.ts` (`LANGS`, `ROUTES` with Spanish at the root, `path`, `getLangFromUrl`,
  `getPageKey`, `alternatePath`), `types.ts`, `utils.ts`.
- **`es.ts`** — every key in the inventory
  ([04-content-model.md](./04-content-model.md#translation-key-inventory)), filled in this order of priority:
  1. Keily's delivered copy, verbatim, from [12-copy-from-keily.md](./12-copy-from-keily.md) — hero
     headline and subline, both About texts, the three section lines, the footer tagline, the facts list.
  2. Our own interface strings (~40), written at production quality: eyebrows, headings, CTAs, form labels,
     validation messages, filter labels, lightbox labels, 404, meta titles and descriptions.
  3. Placeholder prose only where neither exists.
- **`en.ts`** — translated from `es.ts` as authored prose, not literally. It ships without Keily's review
  ([decision 5.3](./09-open-decisions.md#5--delivery--launch-decisions)), so nobody downstream will catch a
  flattened register; the biography in particular is writing work, not conversion work.
- All seven page files (`index`, `sobre-mi`, `mi-trabajo`, `en/index`, `en/about`, `en/my-work`, `404`) plus
  the shared `_*.astro` implementations.
- `BaseLayout` — head, meta, canonical, `hreflang` with `x-default` → Spanish, JSON-LD, skip link, and the
  `SITE.indexable` branch driving `robots` meta. `PageLayout`.

**Done when:** all seven routes build · a missing **English** key is a TypeScript error · `/` serves Spanish
with no redirect · `alternatePath` returns the equivalent page for every route in both directions ·
canonical and `hreflang` are correct on every page and `x-default` points at Spanish · every page carries
`noindex` because `indexable` is `false` · no component contains a literal user-visible string ·
`grep -rn "TODO: copy" src/i18n` lists only strings nobody has written yet, and none of them are Keily's.

**Watch for:** Spanish runs 15–25% longer than English and it is the default. Every string written here is
checked at 320px in Phase 8, so keep buttons and headings short *now* rather than discovering it later.

---

## Phase 3 · Chrome

**1 day.** Everything that appears on every page.

`Header` (transparent over the hero on `/`, `coal` past 24px, persisted across view transitions), `Nav`,
`MobileMenu` (focus trap, `Esc`, scroll lock, `inert`), `LanguageSwitcher`, `Footer` (wordmark, tagline,
nav column, contact column with **both** Instagram links separately labelled), `Button`, `Container`,
`Section`, `SectionHeading`, `Eyebrow`, `Chip`, the icon set. Wire `ClientRouter`.

**Done when:** keyboard-only navigation works across all pages in both languages · the mobile menu traps
focus, closes on `Esc`, returns focus to its trigger, and locks scroll without shifting the page ·
`aria-current="page"` is correct everywhere · the switcher preserves the current page across languages ·
header and footer do not flash during view transitions · the two Instagram links have distinct accessible
names · axe reports 0 violations on the chrome.

**Phases 4–7 all depend on this and on nothing else from each other.** If a second person joins, this is
the fork point.

---

## Phase 4 · Landing page

**2 days.**

`Hero` (scrim, three-segment headline with the `mustang-soft` accent word and its underline, image handling,
preload), `AboutPreview`, `FeaturedWork`, and the `ContactSection` shell. Content collection config, the 20
placeholder photo entries, `lib/photos.ts` with all three query helpers.

**Done when:** `/` and `/en` render all four sections at 375/768/1440 · the hero fills the viewport without
mobile-chrome clipping (`100svh`) · `getFeaturedPhotos()` returns exactly 6 and the build **fails** if fewer
are marked · zero CLS on load · the hero is the LCP element and is preloaded · no horizontal scroll at 320px
in Spanish · the accent word is distinguishable from the rest of the headline at arm's length on a phone.

**Watch for:** the hero image is the one place a small source file shows, since it runs full-bleed at 100vw.
Develop against the 2400×1600 placeholder, but keep the sub-2400px case in mind — it is likely.

---

## Phase 5 · Gallery, filters & lightbox

**3 days.** The long pole, and the largest piece of accessibility work in the build.

1. `MasonryGallery`, `PhotoCard`, `/mi-trabajo` and `/en/my-work` (~1 day).
2. `GalleryFilters` + `gallery-filters.ts` — the three tone chips, counts, `?filter=` sync, the disabled
   zero-count chip, and the omit-the-whole-row case (~0.5 day).
3. `Lightbox` + `lightbox.ts` to the full build spec in
   [09-open-decisions.md](./09-open-decisions.md#build-spec-for-the-lightbox) (~1.5 days).

**Done when:** the masonry renders mixed orientations with no cropping and no layout shift · images use the
correct `widths`/`sizes`, clamped per file, and the first 3 are eager · DOM order is the correct reading
order · hover effects are gated behind `(hover: hover)` · the tone chips filter, sync to `?filter=`,
validate unknown slugs, announce the count politely, render a zero-count chip as disabled, and omit the row
entirely when every photo shares one tone · the lightbox meets **every** keyboard, focus, touch, `inert`,
motion, announcement and preload requirement in the build spec, verified with a screen reader and not by eye
· the lightbox navigates only within the filtered set when a filter is active · no `<Image>` anywhere
requests a width larger than its source.

**Budget the lightbox as its own day.** Modal semantics, focus trap, focus return, `inert` and live
announcements are where this phase overruns, every time.

---

## Phase 6 · Contact form

**1.5 days.**

`ContactForm`, `Field`, `FormStatus`, `lib/validation.ts`, `lib/contact.ts` (the documented stub),
`contact-form.ts` (validation timing, state machine, focus management), honeypot, `<noscript>` fallback, and
the plain visible `mailto:` beside it.

**Done when:** all four states render and are reachable · errors are announced, linked by
`aria-describedby`, and marked with `aria-invalid` · the first invalid field receives focus on failed submit
· errors appear on blur-after-touch, never mid-first-typing, and clear live once fixed · success and error
panels receive focus · the honeypot resolves success without logging · `?contact=fail` reproduces the error
state · every message is localised · the form is completable by keyboard alone · with JS off the `mailto:`
fallback is visible · `submitContact` never throws.

**Remember what this ships as.** The stub confirms and delivers nothing
([decision #4](./09-open-decisions.md#4--contact-form-delivery-resolved-stub-at-launch)). The visible
`mailto:` is the only working contact path in v1, so it gets tested with JavaScript disabled, not assumed.

---

## Phase 7 · About page & motion

**1.5 days.**

`/sobre-mi` and `/en/about` in full — page header, lead, portrait, her ~560-word biography across 8
paragraphs, the secondary image, the five-row facts list, the closing CTA band. Then the entire motion
layer: `Reveal`, `Parallax`, `reveal.ts`, `parallax.ts`, `hero-reveal.ts` (including the accent underline at
520ms), hover states, view transitions, and the reduced-motion block.

**Done when:** the hero timeline runs once on load with no clipped descenders · parallax is smooth at 60fps,
disabled below `md`, and stops once the hero is off-screen · reveals fire once and never on scroll-back ·
stagger caps are respected · with `prefers-reduced-motion: reduce` every page renders fully visible and
nothing animates, including after toggling the OS setting mid-session · with JS disabled nothing is hidden ·
a Performance recording of a full scroll of `/` shows no layout during animation · at most two scroll
listeners and one IntersectionObserver exist site-wide.

**Watch for:** italic Playfair descenders clipped by the line-mask `overflow: hidden`. It is the single most
common way this effect goes wrong, and Spanish adds accents above the caps as well.

---

## Phase 8 · Polish & audit

**1 day.** The quality gate, run against placeholders.

- Favicons: the black italic "K" on a light ground, `favicon.svg` / `favicon-96.png` /
  `apple-touch-icon.png`, plus `theme-color` `#000000`.
- `robots.txt` and the sitemap branch, both driven by `SITE.indexable`.
- JSON-LD, the 404 page in both languages, `og-default.jpg`.
- **A read-through of the English copy.** It ships without Keily's review, so this is the only gate it gets.
- The full audit matrix in
  [08-accessibility-seo-performance.md](./08-accessibility-seo-performance.md#verification), including the
  `mustang`-on-`graphite` contrast sweep.

**Done when:** every budget in
[08-accessibility-seo-performance.md](./08-accessibility-seo-performance.md#budgets) is met on every route
in both locales · Lighthouse Accessibility 100 and Performance ≥ 95 on mobile · 0 axe violations · manual
keyboard and screen-reader passes complete · 200% zoom and 320px width are clean in **Spanish** · every page
carries `noindex` and `robots.txt` disallows all · canonical and `hreflang` are nevertheless correct on all
six routes, verified by hand · no accent text sits on a `graphite` surface in plain `mustang`.

---

## Phase 9 · Real content swap

**1 day. Gated on Keily's photographs — the only thing that waits on her.**

Not a code change. Drop the files in, fill the frontmatter, replace the strings:

1. `src/assets/photos/` ← her 20 exports, plus `hero.jpg`, `portrait.jpg`, `about-secondary.jpg`,
   `og-default.jpg`. The generator never overwrites a real file.
2. One content entry per photograph: `alt` in both languages, `tone`, `order`, and `featured: true` on
   exactly her 6.
3. Confirm the facts list values with her, and apply any correction.
4. Re-run the Phase 8 audit against real images — this is where real file weights and real aspect ratios
   first hit the budgets.

**Done when:** no placeholder image remains · every photo has `alt` in both languages · exactly 6 are
featured · the build's undersized-image warning lists only files she cannot improve · both filter chips have
content, or the filter row is correctly absent · image budgets still pass at 1440px · `grep -rn "TODO" src/
astro.config.mjs` returns nothing.

**The one content risk:** if all 20 arrive in black and white, the tone filter she chose disappears by
design. Flag it to her the day the files land, not at launch.

---

## Phase 10 · Launch

**0.25 days.**

- **Merge `development` → `master`.** This is the moment `keilymargallery.vercel.app` stops being empty;
  confirm the production deploy is green before telling anyone.
- Walk all seven routes on a real phone, in Spanish, on a cold cache.
- **Tell Keily, in as many words, that the contact form does not send yet** and that her email beside it is
  the working path. This is on the checklist because it is the one way this site could quietly lose her a
  message.
- Hand over: how to add a photograph, how to change a string, where the specs live.

**Done when:** the site is live at `keilymargallery.vercel.app`, she has seen it on her own phone, and she
knows what the form does and does not do.

---

## After launch, in whatever order she wants

Each is small and self-contained. None requires undoing anything.

| Work | Cost | Trigger |
|---|---|---|
| **Custom domain** | ~1 hour | She picks one. Point DNS at Vercel, change `SITE.url`, flip `SITE.indexable` to `true` — that one flag turns on the sitemap, drops every `noindex`, and opens `robots.txt`. Nothing to de-index, because nothing was indexed |
| **Contact form delivery** | ~1 hour + a privacy notice | She wants messages in her inbox. One function body in `lib/contact.ts` plus an env var. The privacy notice ships *with* it, not after |
| **Services & pricing** | ~1 day | She asked for it. A fourth nav entry; `ROUTES` and `Nav` already iterate |
| **Blog / diario** | ~1.5 days | She asked for it. A second content collection and an index route |
| **Print sales** | Weeks, and a backend | She asked for it. This is a different project — payments, fulfilment, tax — not an addition to this one |

---

## Sequencing notes

- **Critical path:** 0 → 1 → 2 → 3 → 5 → 8. Phase 5 is the long pole; if anything slips, it is the lightbox.
- **Parallelisable:** phases 4, 5, 6 and 7 depend only on Phase 3, not on each other. With two people, split
  4+7 (pages and motion) against 5+6 (gallery and form).
- **Phase 9 is not on the critical path**, and it can run at any point after Phase 4 — as soon as photographs
  exist, they can go in. Dropping them in early makes every later phase better-tested, because real
  photographs have aspect ratios and file weights that placeholders do not.
- **Do not defer Phase 8 to the end of Phase 9.** Auditing against placeholders catches structural problems;
  auditing again against real images catches weight and aspect problems. They are different passes and both
  are cheap.
