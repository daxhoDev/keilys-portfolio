# 11 · Implementation plan

Eight phases. Each has explicit acceptance criteria; a phase is not done until they all pass. Estimates
assume one developer and are working days, not calendar days.

**Every phase except 5 is unblocked today.** Phase 5 needs decisions
[#1](./09-open-decisions.md#1--gallery-organisation) and
[#2](./09-open-decisions.md#2--photo-click-behaviour), and has a documented zero-cost fallback if they are
still open when it starts. Decision #3 (i18n URL scheme) is resolved: **Spanish at the root, English under
`/en`**.

---

## Phase 1 · Foundation — ~0.5 day

Scaffold Astro, wire Tailwind v4, install fonts, write `global.css` with the full `@theme` token set,
configure TypeScript paths (`~/*` → `src/*`), Prettier, `vercel.json`, `.nvmrc`, npm scripts.
Write `scripts/generate-placeholders.mjs` and run it.

**Done when:** `npm run build` passes with `astro check` clean · a scratch page renders text in Inter and a
heading in italic Playfair · every colour token resolves as a Tailwind utility · `npm run placeholders`
produces all 22 files and is a no-op on a second run.

## Phase 2 · i18n & routing — ~1 day

Write `routes.ts` (`LANGS`, `ROUTES` with Spanish at the root, `path`, `getLangFromUrl`, `getPageKey`,
`alternatePath`), `types.ts`, `utils.ts`, and the full `es.ts` / `en.ts` with every key from the inventory
filled with placeholder prose — Spanish written first, since `es.ts` is the type source of truth.
Create all six page files (`index`, `sobre-mi`, `mi-trabajo`, `en/index`, `en/about`, `en/my-work`) plus the
shared `_*.astro` implementations and the 404. Build `BaseLayout` (head, meta, canonical, `hreflang` with
`x-default` → Spanish, JSON-LD, skip link) and `PageLayout`.

**Done when:** all seven routes build · a missing **English** key is a TypeScript error · `/` serves Spanish
with no redirect · `alternatePath` returns the equivalent page for every route in both directions, verified
by a small test page · canonical and `hreflang` are correct on every page and `x-default` points at Spanish ·
no component contains a literal user-visible string.

## Phase 3 · Chrome — ~1 day

`Header` (transparent/scrolled states, persisted across view transitions), `Nav`, `MobileMenu` (focus trap,
`Esc`, scroll lock, `inert`), `LanguageSwitcher`, `Footer`, `Button`, `Container`, `Section`,
`SectionHeading`, `Eyebrow`, and the icon set. Wire `ClientRouter`.

**Done when:** keyboard-only navigation works across all pages in both languages · the mobile menu traps
focus, closes on `Esc`, returns focus to its trigger, and locks scroll without shifting the page ·
`aria-current="page"` is correct everywhere · the switcher preserves the current page across languages ·
header and footer do not flash during view transitions · axe reports 0 violations on the chrome.

## Phase 4 · Landing page — ~2 days

`Hero` (scrim, segmented headline, image handling, preload), `AboutPreview`, `FeaturedWork`, and the
`ContactSection` shell. Content collection config, the 18 placeholder photo entries, `lib/photos.ts`
with all three query helpers.

**Done when:** `/` and `/en` render all four sections at 375/768/1440 · the hero fills the viewport without
mobile-chrome clipping (`100svh`) · `getFeaturedPhotos()` returns exactly 6 and the build fails if fewer are
marked · zero CLS on load · the hero is the LCP element and is preloaded · no horizontal scroll at 320px in
Spanish.

## Phase 5 · Gallery — ~1.5 days  ⚠️ needs decisions #1 and #2

`MasonryGallery`, `PhotoCard`, `/mi-trabajo` and `/en/my-work`. Then, per decision:
`GalleryFilters` + `gallery-filters.ts` (#1 = A/B/D) and `Lightbox` + `lightbox.ts` (#2 = A/B).

**Fallback if still undecided:** build the unfiltered gallery with `interaction="none"`. That is a complete,
shippable answer (decision #1 option C, decision #2 option C), and both filters and lightbox remain purely
additive afterwards. Do not block on the answers.

**Done when:** the masonry renders mixed orientations with no cropping and no layout shift · images use the
correct `widths`/`sizes` and the first 3 are eager · DOM order is the correct reading order · hover effects
are gated behind `(hover: hover)` · *if filters:* they work, sync to `?filter=`, validate unknown slugs,
announce the count politely, and the empty state renders · *if lightbox:* every keyboard, focus, touch,
`inert` and announcement requirement in [09-open-decisions.md](./09-open-decisions.md#2--photo-click-behaviour)
passes, verified with a screen reader.

## Phase 6 · Contact form — ~1.5 days

`ContactForm`, `Field`, `FormStatus`, `lib/validation.ts`, `lib/contact.ts` (the documented stub),
`contact-form.ts` (validation timing, state machine, focus management), honeypot, `<noscript>` fallback.

**Done when:** all four states render and are reachable · errors are announced, linked by `aria-describedby`,
and marked with `aria-invalid` · the first invalid field receives focus on failed submit · errors appear on
blur-after-touch, never mid-first-typing, and clear live once fixed · success and error panels receive focus ·
the honeypot resolves success without logging · `?contact=fail` reproduces the error state · every message is
localised · the form is completable by keyboard alone · with JS off the `mailto:` fallback is visible ·
`submitContact` never throws.

## Phase 7 · About page & motion — ~1.5 days

`/sobre-mi` and `/en/about` in full. Then the entire motion layer: `Reveal`, `Parallax`, `reveal.ts`,
`parallax.ts`, `hero-reveal.ts`, hover states, view transitions, and the reduced-motion block.

**Done when:** the hero timeline runs once on load with no clipped descenders · parallax is smooth at 60fps,
disabled below `md`, and stops once the hero is off-screen · reveals fire once and never on scroll-back ·
stagger caps are respected · with `prefers-reduced-motion: reduce` every page renders fully visible and
nothing animates, including after toggling the OS setting mid-session · with JS disabled nothing is hidden ·
a DevTools Performance recording of a full scroll of `/` shows no layout during animation · at most two scroll
listeners and one IntersectionObserver exist site-wide.

## Phase 8 · Polish, audit & deploy — ~1 day

Favicons, `robots.txt`, sitemap verification, the JSON-LD blocks, the 404 page, `og-default.jpg`, and the
full audit matrix from [08-accessibility-seo-performance.md](./08-accessibility-seo-performance.md#verification).
Deploy to Vercel.

**Done when:** every budget in
[08-accessibility-seo-performance.md](./08-accessibility-seo-performance.md#budgets) is met on every route in
both locales · Lighthouse Accessibility 100 and Performance ≥ 95 on mobile · 0 axe violations · manual
keyboard and screen-reader passes complete · 200% zoom and 320px width are clean · the sitemap contains all
six indexable routes with `hreflang` alternates · the 404 renders in both languages and is `noindex` · the
site is live on Vercel.

---

## Total

**~10 working days** to a complete, launch-ready build against placeholder content.

Launch itself is additionally gated on [10-content-checklist.md](./10-content-checklist.md) — real photographs,
real copy in both languages, the domain, and the contact details. Swapping placeholders for real content is
not a code change: drop image files into `src/assets/photos/`, fill in the frontmatter, and replace the
`// TODO: copy` strings.

## Sequencing notes

- Decision #3 is settled, so Phase 2 can start immediately.
- **Answer decisions #1 and #2 before Phase 5**, or accept the fallback and treat filters/lightbox as a
  follow-up. Both are additive; neither requires undoing work.
- Phases 4, 5, 6 and 7 are the bulk of the build and are largely independent of each other once Phases 1–3
  are done. If more than one person is working, that is where to split.
- The contact form's stub boundary (`submitContact` in `src/lib/contact.ts`) is the only place a backend
  needs to touch. When a provider is chosen, that is a single-function change plus an env var — the form's
  validation, states, accessibility, honeypot and i18n are all production-ready as built.
