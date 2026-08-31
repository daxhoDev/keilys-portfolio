# 08 · Accessibility, SEO & performance

## Accessibility — target WCAG 2.1 AA

### Structure

- Exactly one `<h1>` per page. Heading levels never skip. Visual size is chosen by prop, never by tag choice.
- Landmarks: `<header>`, `<nav aria-label>`, `<main id="main">`, `<footer>`. Multiple `<nav>` elements each
  carry a distinct `aria-label` from the translations (`t.nav.*`).
- Skip link is the first focusable element, visually hidden until focused, then rendered as a mustang-bordered
  chip at top-left. Targets `#main`, which has `tabindex="-1"`.
- `<html lang>` matches the page locale. Any inline text in the other language (the 404 page, the language
  switcher labels) carries its own `lang` attribute.

### Images

- `alt` is **required** by the content schema — a photo cannot be added without it, in both languages.
- Alt text describes the photograph's content, not "photo by Keily". Purely decorative images (none currently)
  would use `alt=""`.
- Every `<Image>` has explicit `width`/`height` so no layout shift occurs.

### Keyboard

- Every interactive element is reachable and operable by keyboard, in a logical order matching the visual order.
- Focus ring is the global mustang 2px ring; it is never removed.
- Mobile menu: focus trapped while open, `Esc` closes, focus returns to the toggle. Content behind is `inert`.
- Lightbox (if built): full modal semantics — see [09-open-decisions.md](./09-open-decisions.md).
- Gallery filter chips: standard `<button>`s, `Tab` between them, `Enter`/`Space` to activate. No roving
  tabindex — with fewer than ~8 chips it adds complexity without benefit.
- Nothing is operable by hover alone.

### Forms

Covered in detail in [05-pages-and-sections.md](./05-pages-and-sections.md#contact-form). Summary of the
non-negotiables: real `<label for>` on every control; errors announced via `role="alert"` and linked by
`aria-describedby`; `aria-invalid` on invalid fields; first invalid field receives focus on failed submit;
success and error panels receive focus and use `role="status"` / `role="alert"`; nothing is communicated by
colour alone (every error has an icon and text).

### Motion & preferences

`prefers-reduced-motion: reduce` is fully honoured — see [07-motion.md](./07-motion.md#reduced-motion).
No parallax, no reveals, no view transitions, no autoplaying loops under reduced motion.

### Colour

All text/background pairs are pre-verified in [02-design-system.md](./02-design-system.md#verified-contrast-ratios).
Non-text UI (borders on form fields, focus ring, chip outlines) meets 3:1 against its adjacent colour.

**The palette is achromatic**, so colour can never be the only carrier of meaning here — but two rules follow
from Keily's chosen accent and are audited explicitly:

- `mustang` (`#7E7D7B`) is **4.4 : 1 on `graphite`** and therefore fails AA as text on any elevated surface.
  Accent text on cards, form fields and the lightbox uses `mustang-soft`. The audit greps for `mustang`
  (not `-soft`) inside components that render on `graphite`.
- The only chromatic values in the system are `danger` and `success`, both confined to form feedback, and
  both accompanied by text and an icon — never colour alone.

### Verification

| Check | How |
|---|---|
| Automated | axe DevTools on all seven routes (`/`, `/sobre-mi`, `/mi-trabajo`, `/en`, `/en/about`, `/en/my-work`, `/404`) and with the mobile menu open. Target: 0 violations |
| Lighthouse | Accessibility score 100 on every page |
| Keyboard | Manual pass: tab through each page start to finish, complete the form, open and close the menu |
| Screen reader | Manual pass with VoiceOver (Safari) and NVDA (Firefox) on `/` — hero, gallery, and form |
| Zoom | 200% browser zoom and 320px width: no horizontal scroll, no clipped text, no overlapping controls |
| Reduced motion | OS setting enabled: every page loads fully visible, nothing animates |
| No JS | Every page renders complete, readable content; the contact section shows the `mailto:` fallback |

## SEO

### Per-page metadata

Supplied by every page through `BaseLayout`, sourced from `t.meta.*` so titles and descriptions are localised.

- `<title>`: `"{page title} · Keily Mar Couselo"`. On the home page the title is a full sentence
  (`"Keily Mar Couselo — Fotógrafa"` / `"Keily Mar Couselo — Photographer"`), not the pattern.
- `<meta name="description">`: 140–160 characters, unique per page per locale.
- `<link rel="canonical">`: absolute, self-referencing, from `SITE.url` + current path. `SITE.url` is the
  Vercel URL for now; every absolute URL on the site derives from it, so the later domain move is one edit.
- `hreflang` alternates for `es`, `en`, and `x-default` → **Spanish**. Emitted on all indexable pages.

### Social cards

```html
<meta property="og:type" content="website">
<meta property="og:site_name" content="Keily Mar Couselo">
<meta property="og:locale" content="es_ES">          <!-- or en_US on /en pages -->
<meta property="og:locale:alternate" content="en_US"><!-- or es_ES -->
<meta property="og:title" …> <meta property="og:description" …> <meta property="og:url" …>
<meta property="og:image" content="{absolute}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" …>
<meta name="twitter:card" content="summary_large_image">
```

`og:image` defaults to `/og-default.jpg` and can be overridden per page.

### Structured data

JSON-LD in `<head>`:

- **All pages** — `Person`: `name`, `jobTitle` (localised), `url`, `image`, `sameAs` (the `SITE.socials`
  URLs, excluding the `mailto:` entry), `knowsLanguage: ['es', 'en']`.
- **`/my-work`** — `ImageGallery` with an `associatedMedia` array of `ImageObject`s
  (`contentUrl`, `name`, `description` = the localised alt).
- **`/about`** — `AboutPage` referencing the `Person` by `@id`.

All JSON-LD is generated from the same data that renders the page. Hand-written JSON that can drift from
the visible content is not permitted.

### Crawling

- `@astrojs/sitemap` with i18n config emits `sitemap-index.xml` including `hreflang` alternates.
- `/404` always emits `<meta name="robots" content="noindex">`.

### Indexing is off until the custom domain

The site launches on `https://keilymargallery-sage.vercel.app`
([decision 5.2](./09-open-decisions.md#5--delivery--launch-decisions)). Letting that URL into the index only
to redirect away from it later is avoidable work, so a single constant gates the whole thing:

```ts
SITE.indexable === false   // while on *.vercel.app
```

| Output | `indexable: false` (now) | `indexable: true` (custom domain) |
|---|---|---|
| `<meta name="robots">` | `noindex, nofollow` on every page | absent, except on `/404` |
| `robots.txt` | `User-agent: *` / `Disallow: /` | allow all, reference the sitemap |
| Sitemap | not emitted, not referenced | `sitemap-index.xml` with `hreflang` alternates |
| `canonical`, `hreflang`, `og:url` | still correct and still emitted | unchanged |

Canonical and `hreflang` are emitted either way — they must be right the moment indexing is switched on, and
verifying them is part of the Phase 8 audit regardless. **Flipping `indexable` to `true` is a launch step,
not a code change.**
- No page is blocked from indexing except 404.

## Performance

### Budgets

| Metric | Budget |
|---|---|
| LCP (mobile, throttled 4G, mid-tier device) | < 2.5s |
| CLS | < 0.05 |
| INP | < 200ms |
| Total JS on `/`, gzipped | < 30KB |  ← now also carries `lightbox.ts` (~3KB), since the featured grid on `/` is clickable |
| Total JS on `/about`, gzipped | < 12KB |
| Font payload, all faces | < 120KB |
| Hero image, delivered | < 220KB AVIF at 1440px viewport |
| Gallery image, delivered | < 120KB AVIF each at 1× column width |
| Lighthouse Performance (mobile) | ≥ 95 |

Exceeding a budget is a blocking bug, not a nice-to-have.

### Images

- All images run through `astro:assets` at build time. Nothing is served unoptimised.
- Formats: AVIF primary, WebP fallback, via `<Picture>` where a fallback matters; `<Image>` with
  `format="avif"` where AVIF-only is acceptable (all modern targets).
- `widths` and `sizes` are declared per usage — the exact values are in
  [05-pages-and-sections.md](./05-pages-and-sections.md); never rely on the default.
- Every image has explicit `width`/`height`.
- Loading: hero `eager` + `fetchpriority="high"` + preloaded; first 3 gallery items `eager`; everything else
  `lazy` + `decoding="async"`.
- Source images are committed at a sane ceiling — longest edge 2400px, JPEG quality 85. Committing 40MB
  camera originals is not acceptable; the checklist in
  [10-content-checklist.md](./10-content-checklist.md) states the export settings for Keily.

### JavaScript

- No framework runtime. Scripts total well under budget; the largest is `contact-form.ts`, followed by
  `lightbox.ts` at roughly 3KB gzipped.
- Each script is loaded only on pages that need it and exits immediately if its root element is absent.
- `prefetch` with `defaultStrategy: 'viewport'` warms internal links.

### CSS

- Tailwind v4 emits only used utilities. Target: < 20KB gzipped for the whole site.
- No `@import` chains beyond `global.css`. No unused font faces (upright Playfair is never shipped).

### Verification

Run before every release: `npm run build`, then Lighthouse (mobile preset) on all four routes in both
locales, plus a DevTools Performance recording of a full scroll of `/` confirming no layout thrash during
animation.
