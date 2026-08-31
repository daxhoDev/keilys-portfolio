# 01 · Tech stack & project structure

## Runtime & tooling

| Concern | Choice | Notes |
|---|---|---|
| Node | ≥ 20.11 LTS | Pinned in `package.json` `engines` and `.nvmrc` |
| Package manager | npm | Lockfile committed |
| Framework | Astro 5.x | `output: 'static'` |
| Language | TypeScript, `strict` | Extends `astro/tsconfigs/strict` |
| Styling | Tailwind CSS v4 | Via `@tailwindcss/vite`, **not** the legacy `@astrojs/tailwind` integration |
| UI framework | None | Zero React/Vue/Svelte. Interactivity is vanilla TS in `<script>` blocks |
| Images | `astro:assets` (`<Image>`, `<Picture>`) | Sharp service, build-time AVIF/WebP |
| Fonts | Fontsource, self-hosted | No requests to Google Fonts at runtime |
| Formatting | Prettier + `prettier-plugin-astro` + `prettier-plugin-tailwindcss` | |
| Type checking | `astro check` | Runs in CI and in `npm run build` |
| Hosting | Vercel, static | `vercel.json` for headers only; no adapter needed |

### Why no UI framework

Every interactive element on this site (mobile menu, form validation, scroll reveals, parallax, language
switcher, the gallery tone filter, and the lightbox) is small and self-contained. Adding a framework would add a hydration
runtime for no benefit and would jeopardise the < 30KB JS budget. Interactivity is written as plain
TypeScript modules imported from `<script>` tags, which Astro bundles, tree-shakes, and type-checks.

## Dependencies

### Runtime

```
astro                                   ^5
@astrojs/sitemap                        ^3
tailwindcss                             ^4
@tailwindcss/vite                       ^4
@fontsource-variable/inter              ^5
@fontsource/playfair-display            ^5
```

### Dev

```
typescript                              ^5
prettier                                ^3
prettier-plugin-astro                   ^0.14
prettier-plugin-tailwindcss             ^0.6
sharp                                   ^0.33   # explicit, for the placeholder generator script
@playwright/test                        ^1      # browser tests, from Phase 3
@axe-core/playwright                    ^4      # automated accessibility pass
```

Unit and built-output tests use **`node:test`**, which is built into Node and adds no
dependency. See [13-testing.md](./13-testing.md).

Nothing else is added without amending this document. In particular: no animation library (motion is
hand-written, see [07-motion.md](./07-motion.md)), no form library, no icon package (icons are inline SVG
components), and **no lightbox library** — decision #2 resolved to a hand-written one (~3KB) rather than PhotoSwipe
(~40KB), for the reasons in [09-open-decisions.md](./09-open-decisions.md#2--photo-click-behaviour-resolved-a-custom-lightbox).

## Font loading

Self-hosted through Fontsource so there is no third-party request and no FOUT from a remote stylesheet.

```ts
// imported once, in BaseLayout.astro
import '@fontsource-variable/inter';                          // wght 100–900, latin + latin-ext
import '@fontsource/playfair-display/latin-400-italic.css';
import '@fontsource/playfair-display/latin-500-italic.css';
import '@fontsource/playfair-display/latin-600-italic.css';
```

Rules:
- Only **italic** Playfair weights are loaded. The roman/upright faces are never used anywhere in the design
  and must not be shipped.
- Only `latin` and `latin-ext` subsets are loaded (`latin-ext` is required for Spanish `ñ`, `á`, `¿`, `¡`).
- `font-display: swap` (Fontsource default).
- The two files backing the hero headline are `<link rel="preload">`ed in `BaseLayout`.

Total font payload budget: **≤ 120KB** across all faces.

## Configuration

### `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://keilymargallery-sage.vercel.app',   // temporary; custom domain much later
  output: 'static',
  trailingSlash: 'never',
  vite: { plugins: [tailwindcss()] },
  // Sitemap is emitted only when SITE.indexable is true — see 08-accessibility-seo-performance.md
  integrations: [...(SITE.indexable ? [sitemap({ i18n: { defaultLocale: 'es', locales: { es: 'es-ES', en: 'en-US' } } })] : [])],
  image: { service: { entrypoint: 'astro/assets/services/sharp' } },
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
});
```

Astro's built-in `i18n` config block is **not** used. Spanish is the default language and lives at the root
with Spanish slugs (`/sobre-mi`); English is prefixed with English slugs (`/en/about`). Astro's i18n routing
assumes the same slug in every locale, so routing is expressed as real files under `src/pages/` and
`src/pages/en/` plus a mapping table in `src/i18n/routes.ts`.
See [03-information-architecture.md](./03-information-architecture.md).

### `vercel.json`

Static deploy, no functions. Used only to set long-lived cache headers on hashed assets and security headers:

```json
{
  "headers": [
    { "source": "/_astro/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/(.*)", "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
    ]}
  ]
}
```

## Project structure

```
keily-portfolio/
├── public/
│   ├── favicon.svg
│   ├── favicon-96.png
│   ├── apple-touch-icon.png
│   ├── og-default.jpg              # 1200×630
│   └── robots.txt
├── scripts/
│   └── generate-placeholders.mjs   # sharp; reads specs/placeholder-manifest
├── specs/                          # this folder
├── src/
│   ├── assets/
│   │   ├── photos/                 # gallery images, referenced by content entries
│   │   ├── hero.jpg
│   │   ├── portrait.jpg            # About Me photo
│   │   └── about-secondary.jpg     # second image on /about
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.astro
│   │   │   ├── Nav.astro
│   │   │   ├── MobileMenu.astro
│   │   │   ├── LanguageSwitcher.astro
│   │   │   └── Footer.astro
│   │   ├── sections/
│   │   │   ├── Hero.astro
│   │   │   ├── AboutPreview.astro
│   │   │   ├── FeaturedWork.astro
│   │   │   └── ContactSection.astro
│   │   ├── gallery/
│   │   │   ├── MasonryGallery.astro
│   │   │   ├── PhotoCard.astro
│   │   │   ├── GalleryFilters.astro   # Todas · Blanco y negro · Color
│   │   │   └── Lightbox.astro         # full-screen viewer, decision #2 = A
│   │   ├── form/
│   │   │   ├── ContactForm.astro
│   │   │   ├── Field.astro
│   │   │   └── FormStatus.astro
│   │   ├── ui/
│   │   │   ├── Button.astro
│   │   │   ├── SectionHeading.astro
│   │   │   ├── Eyebrow.astro
│   │   │   ├── Chip.astro
│   │   │   └── icons/            # InstagramIcon.astro, MailIcon.astro, ArrowIcon.astro, …
│   │   └── motion/
│   │       ├── Reveal.astro
│   │       └── Parallax.astro
│   ├── content/
│   │   ├── config.ts
│   │   └── photos/               # one .md per photograph
│   ├── i18n/
│   │   ├── en.ts
│   │   ├── es.ts
│   │   ├── routes.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── PageLayout.astro
│   ├── lib/
│   │   ├── contact.ts            # the stubbed submit seam
│   │   ├── validation.ts
│   │   ├── images.ts             # responsiveWidths(): never upscale a small source
│   │   ├── photos.ts             # collection queries + tone counts
│   │   └── site.ts               # site constants: socials, email, handles
│   ├── scripts/                  # client-side TS, imported from <script>
│   │   ├── reveal.ts
│   │   ├── parallax.ts
│   │   ├── hero-reveal.ts
│   │   ├── mobile-menu.ts
│   │   ├── scroll-header.ts
│   │   ├── gallery-filters.ts
│   │   ├── lightbox.ts
│   │   └── contact-form.ts
│   ├── styles/
│   │   └── global.css            # Tailwind import + @theme tokens + base layer
│   └── pages/
│       ├── _home-page.astro       # shared implementations, underscore = not routed
│       ├── _about-page.astro
│       ├── _work-page.astro
│       ├── index.astro            # ES (default)
│       ├── sobre-mi.astro
│       ├── mi-trabajo.astro
│       ├── 404.astro
│       └── en/
│           ├── index.astro
│           ├── about.astro
│           └── my-work.astro
├── .nvmrc
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── vercel.json
```

## npm scripts

```json
{
  "dev": "astro dev",
  "build": "astro check && astro build",
  "preview": "astro preview",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "placeholders": "node scripts/generate-placeholders.mjs"
}
```

## Conventions

- Components are `PascalCase.astro`; scripts, content entries and assets are `kebab-case`.
- No user-visible string is ever hard-coded in a component. Everything comes from `src/i18n/{en,es}.ts`
  via the `t()` helper — this is enforced by review, and violations are treated as bugs.
- Every component that renders text takes `lang: Lang` as a prop, or reads it from `Astro.currentLocale`
  resolved by `getLangFromUrl(Astro.url)`.
- Tailwind utilities are used inline. A `@utility` or `@layer components` class is only introduced when the
  same utility string is repeated **three or more times** and represents a real named concept.
- Arbitrary values (`text-[13px]`) are forbidden. If a value is needed, it is added to `@theme` as a token.
