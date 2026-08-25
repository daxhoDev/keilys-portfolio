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
└── browser/
    ├── chrome.spec.ts      header state, nav, switcher, footer, skip link
    ├── menu.spec.ts        the mobile menu's accessibility contract
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

**6. Every bug found gets a test before it gets a fix.** Both bugs found so far — the
dynamic class name and the too-broad 404 assertion — are now permanent cases.

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

| Suite | Cases | State |
|---|---|---|
| `routes.test.ts` | 13 | passing |
| `dictionary.test.ts` | 21 | passing |
| `images.test.ts` | 9 | passing |
| `build-output.test.ts` | 43 | passing |
| `chrome-markup.test.ts` | 27 | passing |
| **Total, non-browser** | **113** | **passing** |
| `browser/*.spec.ts` | 33 | **cannot run in this environment — see below** |

### The browser suite is blocked, and it is an environment problem

Chromium will not launch on this machine: the WSL2 Debian image is missing
`libglib-2.0.so.0` and the other shared libraries the bundled browser links against.
Installing them needs root:

```bash
sudo npx playwright install-deps chromium
# or: sudo apt-get install -y libglib2.0-0 libnss3 libnspr4 libdbus-1-3 \
#       libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
#       libatspi2.0-0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
#       libgbm1 libpango-1.0-0 libcairo2 libasound2
```

Until that runs, **33 browser assertions are written but unproven**, and they cover the
things least likely to be right by accident: the focus trap, focus return, `Esc`,
scroll lock, `inert`, and axe across all seven routes. The Phase 3 acceptance criteria
that depend on them are **not** met yet, and are not claimed to be.
