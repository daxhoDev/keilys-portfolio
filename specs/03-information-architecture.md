# 03 · Information architecture & i18n

## Route table

**Spanish is the default language and lives at the root.** English is prefixed under `/en` and uses English
slugs. Both decisions are locked.

| Page | Spanish (default) | English | Files |
|---|---|---|---|
| Landing | `/` | `/en` | `src/pages/index.astro` · `src/pages/en/index.astro` |
| About | `/sobre-mi` | `/en/about` | `src/pages/sobre-mi.astro` · `src/pages/en/about.astro` |
| Work | `/mi-trabajo` | `/en/my-work` | `src/pages/mi-trabajo.astro` · `src/pages/en/my-work.astro` |
| 404 | `/404` | `/404` | `src/pages/404.astro` (bilingual, see below) |

`trailingSlash: 'never'`. There is no redirect anywhere: `/` **is** the Spanish homepage, not a hop to one.

### Why not Astro's built-in `i18n` routing

Astro's `i18n` config gives locale prefixing and `getRelativeLocaleUrl`, but it assumes the **same slug** in
every locale. Since the Spanish about page is `/sobre-mi` and the English one is `/en/about`, routing is
expressed as real page files and a mapping table. Each page file is a thin wrapper around a shared
implementation; there is no duplicated markup.

```astro
---
// src/pages/sobre-mi.astro           (Spanish, default)
import AboutPage from '~/pages/_about-page.astro';
---
<AboutPage lang="es" />
```

```astro
---
// src/pages/en/about.astro           (English)
import AboutPage from '~/pages/_about-page.astro';
---
<AboutPage lang="en" />
```

Shared page implementations live in `src/pages/_*.astro` (underscore-prefixed, so Astro does not route them).

## The route map — `src/i18n/routes.ts`

The single source of truth for URLs. Nothing anywhere else builds a path by string concatenation.

```ts
export const LANGS = ['es', 'en'] as const;   // default first
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'es';

export type PageKey = 'home' | 'about' | 'work';

export const ROUTES: Record<PageKey, Record<Lang, string>> = {
  home:  { es: '/',            en: '/en' },
  about: { es: '/sobre-mi',    en: '/en/about' },
  work:  { es: '/mi-trabajo',  en: '/en/my-work' },
};

/** Path for a page in a language. */
export function path(page: PageKey, lang: Lang): string;

/** Which language a URL belongs to. */
export function getLangFromUrl(url: URL): Lang;

/** Which PageKey a URL is, or null for 404. */
export function getPageKey(url: URL): PageKey | null;

/** The equivalent URL of the current page in the other language — powers the switcher. */
export function alternatePath(url: URL, lang: Lang): string;
```

`alternatePath` guarantees the language switcher lands on the **equivalent page**, never on the homepage.
If the current URL has no `PageKey` (i.e. the 404 page), it falls back to `path('home', lang)`.

`getLangFromUrl` returns `'en'` if and only if the first path segment is `en`; everything else is `'es'`.
This is a one-line rule precisely because Spanish is the unprefixed default.

Because every URL in the site is built from this table, adding a third language later (or changing the
scheme again) is a change to `ROUTES` plus new page files — never a change to a component.

## Translation files

`src/i18n/es.ts` and `src/i18n/en.ts` export the same deeply-nested object. **Spanish is the source of
truth**, since it is the default language: `src/i18n/types.ts` derives the dictionary type from `es.ts`, so
**any key missing from English is a TypeScript error at build time**.

```ts
// types.ts
import { es } from './es';
export type Dictionary = typeof es;

// en.ts
import type { Dictionary } from './types';
export const en: Dictionary = { /* … */ };   // ← compile error if a key is missing
```

Practically this means copy is authored in Spanish first and translated into English, which matches how
Keily will actually write it.

Access is via a `t()` helper bound to the current language:

```ts
// utils.ts
export function useTranslations(lang: Lang): Dictionary;
```

```astro
---
import { useTranslations } from '~/i18n/utils';
import { getLangFromUrl } from '~/i18n/routes';
const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---
<h1>{t.hero.headline}</h1>
```

Values may be strings or string arrays (for multi-line/multi-paragraph copy). Interpolation, where needed,
uses a function value: `copyright: (year: number) => \`© ${year} Keily\``.

The full key inventory is specified in [04-content-model.md](./04-content-model.md#translation-key-inventory).

## Navigation

### Header

Sticky, full width, `z-50`. Height 72px mobile / 88px desktop.

- **Initial state on the landing page:** transparent background, sitting over the hero.
- **Scrolled state (> 24px):** `coal` background at 92% opacity, `backdrop-blur-sm`, 1px `iron` bottom
  border. Transition 320ms.
- **On the About, Work and 404 pages:** starts in the scrolled state immediately.

Contents, left → right:
1. **Wordmark** — `SITE.wordmark` ("Keily Mar") in `font-display` at `display-sm`, linking to
   `path('home', lang)`. It is the site's logotype; there is no image logo. The **full** name
   "Keily Mar Couselo" is used in `<title>`, `og:site_name`, JSON-LD and the footer — the header is the one
   place it is shortened, because three words at `display-sm` crowd the nav at 375px. See
   [12-copy-from-keily.md](./12-copy-from-keily.md#identity-and-contact-site).
2. *(spacer)*
3. **Nav links** (desktop ≥ `md`): About · Work · Contact, labelled from `t.nav.*`. "Contact" is an in-page
   anchor to `#contact`, which exists only on the landing page — from the About and Work pages it links to
   `` `${path('home', lang)}#contact` ``.
4. **Language switcher** — `ES / EN` (default language first) with the inactive language as a link and the
   active one as non-interactive `bone` text. `hreflang` and `lang` attributes set on the link.
5. **Menu button** (mobile < `md`) — 44×44, `aria-expanded`, `aria-controls`.

The current page's nav link carries `aria-current="page"` and a persistent mustang underline.

### Mobile menu

Full-screen overlay panel, level-3 surface. Slides in from the right (280ms, `--ease-out-quart`).
Contains the three nav links at `display-md`, the language switcher, and the social links.

Requirements: focus trapped while open, `Esc` closes, focus returns to the trigger on close,
background scroll locked (`overflow: hidden` on `<body>` plus scrollbar-width compensation),
`aria-hidden` correctly toggled on the rest of the document, closes on route change.

### Footer

Present on every page. Three zones, stacked on mobile:

1. Wordmark + one-line tagline (`t.footer.tagline` — *"Las fotografías; epitafios de lo que vivo"*).
2. Navigation column: About, My Work, Contact.
3. Contact column: email `mailto:` link, **both** Instagram links (work and personal, separately
   labelled), language switcher.

Bottom bar: `© {currentYear} Keily Mar Couselo. {t.footer.rights}` at `body-sm` in `mist`, with a 1px `iron` rule above.

`currentYear` is computed at **build time** (`new Date().getFullYear()`), which is correct for a static site
that is rebuilt on content change; the acceptance criterion is simply that it is not hard-coded.

## The 404 page

Astro emits a single `/404.html` for a static build, so it cannot be per-locale.

Behaviour: the page renders its heading and body **in both languages**, **Spanish first**, separated by a
mustang hairline — `<section lang="es">` then `<section lang="en">`. Each half offers a link back to its own
homepage. The document's root `lang` is `es`, matching the default language. This is intentional and is the
simplest correct answer for a static host; it is not a placeholder.

Content: `display-lg` "404", a short line ("Esta página no existe." / "This page doesn't exist."), and a ghost
button back to the homepage. No search, no gallery, no suggestions.

## `hreflang` and canonical

Emitted by `BaseLayout` on every page, derived from `alternatePath`:

```html
<link rel="canonical" href="{site}{currentPath}">
<link rel="alternate" hreflang="es" href="{site}{esPath}">
<link rel="alternate" hreflang="en" href="{site}{enPath}">
<link rel="alternate" hreflang="x-default" href="{site}{esPath}">
```

`x-default` points at the **Spanish** URL, because Spanish is the default language.

The 404 page emits `<meta name="robots" content="noindex">` and no `hreflang`.

## Language detection

**There is none.** No IP geolocation, no `Accept-Language` redirect, no cookie. `/` is Spanish; visitors who
want English click the switcher. Rationale: automatic redirects break shared links and back-button behaviour,
require server logic the static build does not have, and are a well-known accessibility and SEO hazard.

The switcher is therefore the only route into English, which makes its placement matter: it is visible in the
header at every breakpoint, not buried in the mobile menu alone.
