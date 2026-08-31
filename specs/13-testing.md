# 13 · Testing

**Every phase ships with tests. A phase is not done when it renders — it is done when
its acceptance criteria in [11-implementation-plan.md](./11-implementation-plan.md) are
proved by something that runs.**

This is not a quality ritual. The failures that matter in this build are not crashes:
they are things that compile, render, and are quietly wrong — a canonical URL with a
trailing slash, a page that lost its `noindex`, a Tailwind class that was never emitted
because it was constructed at runtime, an English key that silently fell back to
Spanish, one of Keily's sentences tidied up by someone who thought it read better.
None of those announce themselves. All of them are cheap to assert.

## The stack

| Layer | Tool | Why |
|---|---|---|
| Unit | **`node:test`** | Built into Node 24, runs `.ts` directly, zero dependencies |
| Built output | **`node:test`** against `dist/` | The bug is usually in what was *emitted*, not in the source |
| Browser | **Playwright** (`chromium`) | Focus, keyboard, scroll lock and `inert` are behaviour, not markup |
| Accessibility | **`@axe-core/playwright`** | The automated half of the Phase 8 audit, run from Phase 3 onwards |

Nothing else is added without amending this document and
[01-tech-stack.md](./01-tech-stack.md).

```
npm test            # build, then unit + built-output + browser
npm run test:unit   # fast: routing, dictionaries, image helpers
npm run test:build  # assertions against dist/ (needs a build first)
npm run test:browser
```

## What lives where

```
tests/
├── routes.test.ts          route map: every page, every language, both directions
├── dictionary.test.ts      key parity, and Keily's copy pinned verbatim
├── images.test.ts          responsiveWidths never upscales
├── build-output.test.ts    canonical, hreflang, noindex, JSON-LD, CSS, fonts
├── chrome-markup.test.ts   header/nav/footer as emitted
├── gallery.test.ts         masonry, tone filters, lightbox markup
├── hero-contrast.test.ts   the veil measured against the real photograph
├── validation.test.ts      the contact validators, as pure functions
├── contact-form.test.ts    the form as emitted, and the stub's guarantees
├── motion.test.ts          the .js gate, reduced motion, what may be animated
├── about-page.test.ts      her biography, whole and in order
├── landing.test.ts         hero, featured grid, about preview, contact shell
├── hero-contrast.test.ts   the veil, measured against the real photograph
├── css-utilities.test.ts   token utilities emitting no CSS, and invalid calc()
├── gallery.test.ts         tone-filter rules, gallery markup, lightbox semantics
└── browser/
    ├── chrome.spec.ts      header state, nav, switcher, footer, skip link
    ├── menu.spec.ts        the mobile menu accessibility contract
    ├── lightbox.spec.ts    focus, keyboard, inert, live region, filtered navigation
    └── a11y.spec.ts        axe on all seven routes and on the open menu
```

## Rules

**1. Test the built output, not the dev server.** The dev server serves unbundled
modules and unminified CSS. It can pass while what actually deploys is broken. Every
browser test runs against `astro preview`.

**2. Assert on emitted CSS, not on source.** Tailwind scans source as text, so a class
built as `` `bg-${token}` `` produces no rule and no error. This already happened once,
in Phase 1, and was caught by grepping the built stylesheet. That check is now
`build-output.test.ts`.

**3. Keily's words are pinned.** `dictionary.test.ts` asserts her hero, subline, About
lead, closing lines, section lines, footer tagline and facts **exactly**. A future
"improvement" to her phrasing fails the suite. The two sanctioned edits (`Exploro`, the
colon) are asserted as *present*, so nobody reverts them by accident either. The same
file also fails on invisible characters — a soft hyphen arrived in her pasted text once
already.

**4. A static check never claims a behavioural pass.** `chrome-markup.test.ts` says so
in its own header: a passing markup test does not mean the mobile menu is accessible.
Focus trapping, `Esc`, focus return, scroll lock and `inert` are only proved by
`browser/menu.spec.ts`.

**5. Exhaustive where the data allows it.** The route map is small and total, so
`routes.test.ts` iterates every page × language × direction rather than picking
examples. Same for canonical, `hreflang` and `noindex`: every route, every time.

**6. Every bug found gets a test before it gets a fix.** So far: the dynamic class name,
the too-broad 404 assertion, `transition:persist` freezing the nav, a straight apostrophe
in a display headline, duration tokens that emitted no CSS at all, and a negative margin
that compiled to invalid `calc()`. Each is now a permanent case.

**7. Beware the source scanner.** Tailwind scans *everything* as source text — comments
and test files included. Naming a broken class in a comment is enough to emit the broken
rule, which happened twice while fixing exactly that bug. Describe such classes; do not
write them out.

## What tests do *not* cover

Stated plainly, so a green suite is never mistaken for a finished audit:

- **Screen-reader output.** VoiceOver and NVDA passes are manual, in Phase 8.
- **Visual design.** Nothing asserts that the site looks right. Contrast *ratios* are
  pinned in [02-design-system.md](./02-design-system.md) and checked by eye and by axe;
  layout, rhythm and type colour are human judgement.
- **200% zoom and 320px width.** Manual.
- **Lighthouse budgets.** Phase 8, against real images.
- **Whether the English reads well.** It ships without Keily's review
  ([decision 5.3](./09-open-decisions.md#5--delivery--launch-decisions)); the suite
  checks that keys exist and lengths are in range, which is not the same thing.

## Current status

Everything runs. `npm test` builds, runs the node suites, then the browser suites.

| Suite | Cases | State |
|---|---|---|
| `routes.test.ts` | 13 | passing |
| `dictionary.test.ts` | 25 | passing |
| `images.test.ts` | 9 | passing |
| `validation.test.ts` | 18 | passing |
| `build-output.test.ts` | 43 | passing |
| `chrome-markup.test.ts` | 38 | passing |
| `landing.test.ts` | 27 | passing |
| `about-page.test.ts` | 13 | passing |
| `gallery.test.ts` | 36 | passing |
| `contact-form.test.ts` | 25 | passing |
| `motion.test.ts` | 30 | passing |
| `hero-contrast.test.ts` | 5 | passing |
| `css-utilities.test.ts` | 7 | passing |
| `budgets.test.ts` | 19 | passing |
| **Total, non-browser** | **308** | **passing** |
| `browser/*.spec.ts` (desktop + mobile) | **116** | **passing** |

The browser suite was blocked for six phases: Chromium could not launch because this
WSL2 image was missing `libglib-2.0.so.0` and the other shared libraries it links
against. Installing them needs root:

```bash
sudo npx playwright install-deps chromium
```

**That gap had a cost, and it is worth recording.** Five bugs reached a person during
those phases, and the browser suite already contained a test for each one before it
shipped:

| Bug | The test that would have caught it |
|---|---|
| `transition:persist` froze `aria-current` and the language switcher | `chrome.spec.ts` — "aria-current follows a client-side navigation" |
| Lightbox close and arrows were inert | `lightbox.spec.ts` — "the close and arrow buttons actually respond" |
| The active filter chip never repainted | `lightbox.spec.ts` — "the active filter chip repaints when pressed" |
| "Too short" errors rendered as a bare icon | `contact.spec.ts` — "a too-short name shows readable text" |
| Reveals stopped after any client-side navigation | `chrome.spec.ts` — "elements still animate in after navigating" |

A suite that cannot run is not a safety net. It is a record of what you meant to check.
