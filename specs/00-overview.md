# 00 · Overview

## Product

A personal portfolio website for **Keily**, a photographer. The site presents who she is and shows her
photographic work, and gives visitors a way to contact her. It is a marketing/portfolio site, not an
application: there are no accounts, no store, no admin panel.

Her practice spans many subjects, and **her photographs are predominantly black and white**. This is the
single most important fact driving the design: the interface must never compete with the images. The
palette is deliberately desaturated and dark so that monochrome photography reads as the only source of
contrast on the page, with gold used sparingly as the sole chromatic accent.

## Audience

| Audience | What they need |
|---|---|
| Prospective clients | Confidence in her eye and craft; an obvious way to get in touch |
| Galleries, editors, collaborators | A coherent body of work, quickly scannable, and a bio |
| Casual visitors from Instagram | A fast, beautiful mobile experience; a reason to follow |

Primary conversion action: **submitting the contact form** (or reaching her via the email/Instagram links).

## Scope — in

- Landing page at `/` with four sections: Hero, About Me, My Work (featured), Contact Me.
  *(Throughout these documents, "`/about`" and "`/my-work`" are used as informal shorthand for the About and
  Work pages. The authoritative URLs are in
  [03-information-architecture.md](./03-information-architecture.md#route-table).)*
- **About page** — full biography and background. `/sobre-mi` (ES) · `/en/about` (EN).
- **Work page** — the full gallery. `/mi-trabajo` (ES) · `/en/my-work` (EN).
- Styled 404 page.
- Full bilingual ES/EN coverage of every page and every string. Spanish is the default.
- Contact form with complete UI, client-side validation, and all interaction states.
- Responsive from 320px to ultrawide.
- WCAG 2.1 AA.

## Scope — out (this phase)

- Any backend, server rendering, database, or API. `output: 'static'` only.
- Real delivery of contact-form submissions (the submit handler is a documented stub — see
  [05-pages-and-sections.md](./05-pages-and-sections.md#contact-form)).
- CMS or admin editing. Content is edited by changing files in the repo.
- Services, pricing, testimonials, blog, client galleries, print sales, booking.
- Legal pages (privacy notice, cookie banner). These become required when the form starts actually
  transmitting personal data; they are deferred with that work.
- Analytics.
- Light theme. The site is dark-only by design.

## Non-goals

- The site does not aim to display every photograph she has ever taken. `/my-work` is a curated body of
  work; `/` shows a tighter selection still.
- The site does not aim to be a general-purpose template. Decisions may be opinionated and hard-coded
  where that produces a better result.

## Success criteria

| Criterion | Target |
|---|---|
| Largest Contentful Paint (mobile, 4G) | < 2.5s |
| Cumulative Layout Shift | < 0.05 |
| Interaction to Next Paint | < 200ms |
| JavaScript shipped on `/` | < 30KB gzipped |
| Lighthouse Accessibility | 100 |
| Axe violations | 0 |
| Keyboard-only completion of the contact form | Possible without a mouse, no traps |
| Every image | Has meaningful `alt` text in the active locale |
| Every user-visible string | Exists in both `en` and `es`; no hard-coded text in components |

## Constraints

- Frontend only, static output, deployable to Vercel with no serverless functions.
- No content available at spec time — the build proceeds against generated placeholders and a documented
  content checklist ([10-content-checklist.md](./10-content-checklist.md)).
- Two decisions remain open ([09-open-decisions.md](./09-open-decisions.md)), both concerning the gallery.
  The architecture is deliberately designed so that both can be answered late without rework.
- Spanish is the site's default language. English is a full, equal translation, but Spanish is what a
  visitor gets at the bare domain.
