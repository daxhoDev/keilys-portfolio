# 06 · Component inventory

Every component is an `.astro` file. Props are typed with an exported `Props` interface. Components never
contain literal user-visible text — they receive it as props or read it from `t`.

## Layouts

### `BaseLayout.astro`
Owns `<html>`, `<head>`, `<body>`, the skip link, `Header`, `<slot />`, `Footer`, and the global scripts.

```ts
interface Props {
  lang: Lang;
  title: string;              // becomes "<title> · Keily Mar Couselo", except on home (used verbatim)
  description: string;
  image?: string;             // OG image path, defaults to /og-default.jpg
  noindex?: boolean;
  transparentHeader?: boolean; // true only on the landing page
}
```

Responsibilities: font imports, `global.css` import, canonical + `hreflang` links (from `alternatePath`),
OG/Twitter meta, JSON-LD, `<meta name="theme-color" content="#000000">`, favicon links,
`ClientRouter` for view transitions, and the skip link (`t.nav.skipToContent` → `#main`).

### `PageLayout.astro`
Wraps `BaseLayout` for `/about` and `/my-work`: renders the standard page header block (eyebrow, `<h1>`,
lead) and provides a `<slot />` for page body. Sets `transparentHeader={false}`.

```ts
interface Props extends Omit<BaseProps, 'transparentHeader'> {
  eyebrow: string;
  heading: string;
  lead?: string;
  container?: 'content' | 'narrow' | 'wide';
}
```

## Layout components

| Component | Props | Notes |
|---|---|---|
| `Header.astro` | `lang`, `transparent?: boolean` | Sticky. Scroll-state attribute toggled by `scroll-header.ts` using a passive listener + `requestAnimationFrame`. **Not** `transition:persist` — see below |
| `Nav.astro` | `lang`, `variant: 'header' \| 'mobile' \| 'footer'` | Single source of nav items, built from `ROUTES`. Sets `aria-current="page"` by comparing `getPageKey(Astro.url)` |
| `MobileMenu.astro` | `lang` | `<dialog>`-free custom overlay. Focus trap, `Esc`, scroll lock, `inert` on the page behind |
| `LanguageSwitcher.astro` | `lang`, `variant: 'inline' \| 'stacked'` | Uses `alternatePath(Astro.url, other)`. Active language is a `<span aria-current="true">`, not a link. Link carries `hreflang` and `lang` |
| `Footer.astro` | `lang` | Three zones + bottom bar. Year computed at build time |

### Why the header is not persisted

An earlier draft of this document specified `transition:persist` on the header. That is
wrong, and it shipped as a bug: persist keeps the **old** DOM element across a
client-side navigation, and this header carries per-page state —

- `aria-current="page"` on the nav, derived from `getPageKey(Astro.url)`
- the language switcher's `href`, derived from `alternatePath(Astro.url, other)`

With persist on, both froze at whatever the first page rendered. After one navigation
the switcher still pointed at the previous page's counterpart, and no nav item was
marked as current.

The header is visually identical between pages, so letting it swap costs nothing. Any
element given `transition:persist` must hold **no** state derived from the URL.
Regression tests: `tests/chrome-markup.test.ts`.

## Sections

| Component | Props | Notes |
|---|---|---|
| `Hero.astro` | `lang` | Owns the scrim, the segmented `<h1>`, and the reveal/parallax hooks |
| `AboutPreview.astro` | `lang` | Two-column intro + portrait |
| `FeaturedWork.astro` | `lang`, `photos: Photo[]` | Receives exactly 6 photos; asserts the count |
| `ContactSection.astro` | `lang` | Wraps `ContactForm` + the socials sidebar. Owns `id="contact"` |

## Gallery

### `MasonryGallery.astro`
```ts
interface Props {
  photos: Photo[];
  lang: Lang;
  columns?: { base?: number; sm?: number; lg?: number; xl?: number };  // default { base:1, sm:2, lg:3 }
  eagerCount?: number;         // default 3
  interaction?: PhotoInteraction;
}
```
Renders a `<ul>` of `PhotoCard`s inside a CSS-columns container. The `columns` prop maps to a fixed
allowlist of Tailwind classes — no dynamic class string construction, since Tailwind cannot see those.

### `PhotoCard.astro`
```ts
type PhotoInteraction = 'none' | 'lightbox' | 'link';   // ships as 'lightbox' everywhere

interface Props {
  photo: Photo;
  lang: Lang;
  loading: 'eager' | 'lazy';
  index: number;               // used for the stagger delay and lightbox indexing
  interaction: PhotoInteraction;
}
```
Renders `<li><figure>` with the `<Image>` and an optional `<figcaption>`. `interaction` selects the wrapper:
`none` → no wrapper; `lightbox` → `<button>` with `aria-haspopup="dialog"` and the photo title (falling
back to its `alt`) as its accessible name; `link` → `<a>` to a detail page.

**Every gallery ships `interaction="lightbox"`** ([decision #2 = A](./09-open-decisions.md#2--photo-click-behaviour-resolved-a-custom-lightbox)).
`none` and `link` stay in the union because they cost one line each and they are the escape hatches if the
lightbox ever has to be disabled or replaced by per-photo pages.

The card also carries `data-tone` (from `photo.tone`) and `data-index`; `gallery-filters.ts` toggles on the
first and `lightbox.ts` indexes on the second. Neither script needs to know anything else about the card.

### `GalleryFilters.astro`
```ts
type ToneFilter = 'all' | 'bw' | 'colour';

interface Props {
  lang: Lang;
  filters: { slug: ToneFilter; label: string; count: number }[];   // always in this order
  active: ToneFilter;                                              // 'all' on first load
}
```
Three chips — *Todas · Blanco y negro · Color*
([decision #1 = D](./09-open-decisions.md#1--gallery-organisation-resolved-d-tone)). `role="group"`
labelled by `t.work.filters.label`; each filter a `<button aria-pressed>`. Filtering is client-side
(the `hidden` attribute toggled per item, plus a URL param update via `history.replaceState`) — every photo
is in the DOM, so there is no re-layout flash and no data fetch.

Two rules the component enforces rather than the page: a chip with `count === 0` renders `disabled` with its
count still visible, and the component **renders nothing at all** if every photo shares one tone. See
[05-pages-and-sections.md](./05-pages-and-sections.md#my-work).

### `Lightbox.astro`
Built in Phase 5. Specified in full — dialog semantics, chrome, keyboard, focus, touch, `inert`, motion,
announcements, preloading — in
[09-open-decisions.md](./09-open-decisions.md#build-spec-for-the-lightbox).
```ts
interface Props {
  lang: Lang;      // for t.lightbox.* — the dialog is rendered once per page, not once per photo
}
```
It reads its photo list from the gallery already in the DOM, so it takes no `photos` prop and the two
components never disagree about ordering. When a filter is active it walks only the non-`hidden` cards.

## Form

| Component | Props | Notes |
|---|---|---|
| `ContactForm.astro` | `lang` | Owns the `<form novalidate>`, honeypot, state machine wiring |
| `Field.astro` | `id`, `name`, `label`, `type`, `required`, `placeholder?`, `autocomplete?`, `rows?`, `maxlength?`, `help?` | Renders label + control + error slot with all ARIA wiring. `type: 'textarea'` switches the element |
| `FormStatus.astro` | `lang` | The success panel and the error alert, both present in the DOM and toggled with `hidden` so focus management is straightforward |

## UI

| Component | Props |
|---|---|
| `Button.astro` | `variant: 'primary' \| 'ghost'`, `size?: 'md' \| 'lg'`, `href?`, `type?`, `disabled?`, plus `...rest`. Renders `<a>` when `href` is present, `<button>` otherwise |
| `SectionHeading.astro` | `eyebrow?`, `heading`, `lead?`, `as?: 'h1' \| 'h2' \| 'h3'` (default `h2`), `size?: 'lg' \| 'md'`, `align?: 'start' \| 'center'` |
| `Eyebrow.astro` | `text` |
| `Chip.astro` | `label`, `count?`, `active`, `value` |
| `Container.astro` | `size?: 'content' \| 'narrow' \| 'wide'`, `as?: string` |
| `Section.astro` | `background: 'ink' \| 'coal'`, `spacing?: 'default' \| 'tight'`, `id?` |
| `icons/*.astro` | `class?`, `title?` |

## Motion

| Component | Props | Notes |
|---|---|---|
| `Reveal.astro` | `delay?: number` (ms), `as?: string`, `distance?: number` (px, default 24) | Adds `data-reveal` + inline `--reveal-delay`. All observation is done by one shared IntersectionObserver in `reveal.ts` |
| `Parallax.astro` | `factor?: number` (default 0.15) | Adds `data-parallax`; `parallax.ts` transforms it on scroll |

Both render their children unchanged when `prefers-reduced-motion: reduce` — the CSS makes the initial state
fully visible, so a reveal that never fires can never hide content.

## Client scripts

| File | Bundle | Responsibility |
|---|---|---|
| `reveal.ts` | all pages | One `IntersectionObserver`, `threshold: 0.15`, `rootMargin: '0px 0px -8% 0px'`, unobserves after firing |
| `parallax.ts` | landing only | Single scroll listener, `passive`, rAF-throttled, `transform: translate3d` only |
| `hero-reveal.ts` | landing only | Line-by-line headline reveal on load |
| `scroll-header.ts` | all pages | Toggles the header's scrolled class |
| `mobile-menu.ts` | all pages | Open/close, focus trap, scroll lock |
| `contact-form.ts` | landing only | Validation, state machine, calls `submitContact` |
| `gallery-filters.ts` | `/my-work` | Tone filter toggling, chip `aria-pressed`, count announcement, `?filter=` sync |
| `lightbox.ts` | any page with a gallery (`/` and `/my-work`) | Lightbox controller — open/close, focus trap, keyboard, swipe, preload |

All scripts are idempotent and re-initialise on `astro:page-load` (fired by `ClientRouter`), so view
transitions do not leave dead listeners. Every script guards on the existence of its root element and exits
early if absent, so no page pays for a script it does not need beyond a few bytes.
