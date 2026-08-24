# Keily — Photographer Portfolio · Specification

Complete specification for a bilingual (EN/ES), frontend-only artist portfolio built with Astro.

**Every design decision is now closed.** Keily answered the questionnaire — all three open decisions are
resolved in [09-open-decisions.md](./09-open-decisions.md), and her Spanish copy is transcribed in
[12-copy-from-keily.md](./12-copy-from-keily.md). What remains is **content**: the 20 photographs, the
English translation, and a domain ([10-content-checklist.md](./10-content-checklist.md)).

Her answers, in her own words: **[preguntas-para-keily.md](./preguntas-para-keily.md)**

## Documents

| # | Document | Covers |
|---|---|---|
| 00 | [Overview](./00-overview.md) | Goals, audience, scope, non-goals, success criteria |
| 01 | [Tech stack](./01-tech-stack.md) | Astro, Tailwind v4, tooling, dependencies, project structure |
| 02 | [Design system](./02-design-system.md) | Colour, typography, spacing, elevation, components tokens |
| 03 | [Information architecture](./03-information-architecture.md) | Routes, i18n strategy, navigation, language switching |
| 04 | [Content model](./04-content-model.md) | Content collections, schemas, translation files, assets |
| 05 | [Pages & sections](./05-pages-and-sections.md) | Section-by-section spec for every page |
| 06 | [Components](./06-components.md) | Component inventory, props, responsibilities |
| 07 | [Motion](./07-motion.md) | Expressive motion spec, easings, reduced-motion behaviour |
| 08 | [Accessibility, SEO & performance](./08-accessibility-seo-performance.md) | AA compliance, metadata, budgets |
| 09 | [Open decisions](./09-open-decisions.md) | ✅ All three resolved — kept for the reasoning behind each answer |
| — | [preguntas-para-keily.md](./preguntas-para-keily.md) | The questionnaire, **with her answers** |
| — | [pendientes-para-keily.md](./pendientes-para-keily.md) | Follow-up in Spanish: her two questions answered, and what is still missing |
| 10 | [Content checklist](./10-content-checklist.md) | Everything Keily must supply before launch |
| 11 | [Implementation plan](./11-implementation-plan.md) | **Eleven phases, empty repo → live site**, with acceptance criteria per phase |
| 12 | [Copy from Keily](./12-copy-from-keily.md) | Her delivered Spanish copy, verbatim, mapped to translation keys |

## Decisions already locked

| Area | Decision |
|---|---|
| Framework | Astro 5, static output (`output: 'static'`) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, tokens in `@theme` |
| Typography | Inter (body, sans) + Playfair Display Italic (headers, accents) |
| Palette | Pure black base, layered neutral greys, *gris mustang* `#7E7D7B` accent — **chosen by Keily** |
| Photos | Astro content collections, local image files, build-time optimisation. Widths clamped to each source — nothing is upscaled |
| Gallery layout | Masonry columns, native aspect ratios, no cropping |
| Gallery filters | By tone — *Todas · Blanco y negro · Color* (decision #1 = D) |
| Photo click | Full-screen lightbox, hand-written, ~3KB, no library (decision #2 = A) |
| Motion | **Expressive** — hero reveal, parallax, staggered entrances, animated mustang underlines |
| Languages | Bilingual ES + EN. **Spanish is the default language**, at the root (`/`, `/sobre-mi`, `/mi-trabajo`); English is prefixed (`/en`, `/en/about`, `/en/my-work`) |
| Contact form | Full UI + validation + states; **ships as a stub at launch** — no delivery, email visible beside it |
| Socials | Two Instagram accounts (`@kyliemargallery`, `@_kyliemar_`) + email. Extensible list |
| Name | **Keily Mar Couselo**; header wordmark "Keily Mar" |
| Favicon | Black italic "K" on a light ground — inverted from the site, her choice |
| Hosting | Vercel, static, at `keilymargallery.vercel.app`. `noindex` until a custom domain, which comes much later |
| Extra scope | Styled 404 only. She has asked for **services & pricing, a blog, and print sales** in a later phase |
| Content | Spanish copy delivered; English and interface strings are ours to write. **The 20 photographs are the only outstanding item** |
