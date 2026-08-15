# Keily — Photographer Portfolio · Specification

Complete specification for a bilingual (EN/ES), frontend-only artist portfolio built with Astro.
**No code is written until every document here is agreed.** Two decisions are still open — see
[09-open-decisions.md](./09-open-decisions.md).

Questions to send to Keily, in Spanish and non-technical:
**[preguntas-para-keily.md](./preguntas-para-keily.md)**

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
| 09 | [Open decisions](./09-open-decisions.md) | **Unresolved** — must be answered before the phases they block |
| — | [preguntas-para-keily.md](./preguntas-para-keily.md) | Non-technical questionnaire in Spanish, ready to send to Keily as-is |
| 10 | [Content checklist](./10-content-checklist.md) | Everything Keily must supply before launch |
| 11 | [Implementation plan](./11-implementation-plan.md) | Phased build order with acceptance criteria |

## Decisions already locked

| Area | Decision |
|---|---|
| Framework | Astro 5, static output (`output: 'static'`) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, tokens in `@theme` |
| Typography | Inter (body, sans) + Playfair Display Italic (headers, accents) |
| Palette | Almost-black brown base, layered dark browns, gold accent |
| Photos | Astro content collections, local image files, build-time optimisation |
| Gallery layout | Masonry columns, native aspect ratios, no cropping |
| Motion | **Expressive** — hero reveal, parallax, staggered entrances, animated gold underlines |
| Languages | Bilingual ES + EN. **Spanish is the default language**, at the root (`/`, `/sobre-mi`, `/mi-trabajo`); English is prefixed (`/en`, `/en/about`, `/en/my-work`) |
| Contact form | Full UI + validation + states; submit handler is a documented stub, no backend |
| Socials | Instagram + email address (extensible list) |
| Hosting | Vercel, static |
| Extra scope | Styled 404 only. Services, pricing, testimonials, legal pages → later phase |
| Content | None available yet — placeholders generated from a manifest |
