# 02 · Design system

## Design principle

The photographs are black and white. **The interface therefore contributes no colour competition and no
visual noise.** The page is black; every surface above it is a barely-lighter neutral grey; every piece of
text is an off-white or a muted grey; the *mustang* grey appears as a detail — rules, hairlines, marks,
active states. If a decision is ambiguous, choose the quieter option.

Second principle: **generous negative space**. A black background with lots of air makes monochrome images
feel like prints on a wall rather than tiles on a screen.

Third principle, and the one that governs this palette: **hierarchy is carried by brightness, not by hue.**
There is no chromatic accent to shout with. Emphasis escalates `mist` → `bone`; the accent grey marks
things rather than brightening them. Where gold would have coloured something, the neutral system either
brightens it or draws a 1px `mustang` rule beside it.

> **Decided by Keily** (see [preguntas-para-keily.md](./preguntas-para-keily.md)): black background,
> details in *gris mustang* `#7E7D7B`, and no gold anywhere. The rest of the palette below is derived from
> those two values.

## Colour

### Palette

All values are exact. Names are used verbatim as Tailwind token names.

| Token | Hex | Role |
|---|---|---|
| `ink` | `#000000` | Page background. **Pure black — Keily's choice**, the predominant colour of the site |
| `coal` | `#0C0C0B` | Alternating section background, header when scrolled |
| `graphite` | `#161615` | Cards, form fields, lightbox chrome, elevated surfaces |
| `iron` | `#262624` | Borders, dividers, hairlines |
| `steel` | `#3C3B39` | Stronger borders, form field borders on hover |
| `mustang-dim` | `#565553` | Subdued accent rules, disabled foreground, pressed accent fill |
| `mustang` | `#7E7D7B` | **Keily's accent.** Rules, hairlines, focus ring, eyebrow text, active states, primary button fill |
| `mist` | `#A3A19E` | Secondary/muted body text, captions, labels |
| `mustang-soft` | `#B4B2AF` | Silver step: accent hover, accent text on elevated surfaces, hero accent word |
| `bone` | `#F2F1EF` | Primary text, headings, maximum emphasis |
| `danger` | `#E06B5A` | Form validation errors (desaturated so it stays in-family) |
| `success` | `#7FA86B` | Form success state (desaturated) |

`danger` and `success` are the **only** chromatic values in the system. They exist because a form error that
is only distinguishable by wording is a usability failure, and they never appear outside form feedback.

### Semantic aliases

| Alias | Value |
|---|---|
| `--color-bg` | `ink` |
| `--color-bg-alt` | `coal` |
| `--color-surface` | `graphite` |
| `--color-border` | `iron` |
| `--color-border-strong` | `steel` |
| `--color-text` | `bone` |
| `--color-text-muted` | `mist` |
| `--color-accent` | `mustang` |
| `--color-accent-soft` | `mustang-soft` |

### Verified contrast ratios

Measured against WCAG 2.1. Every combination the design actually uses:

| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| `bone` | `ink` | 18.6 : 1 | AAA |
| `bone` | `coal` | 17.3 : 1 | AAA |
| `bone` | `graphite` | 16.0 : 1 | AAA |
| `mist` | `ink` | 8.2 : 1 | AAA |
| `mist` | `graphite` | 7.0 : 1 | AAA |
| `mustang-soft` | `ink` | 9.9 : 1 | AAA |
| `mustang-soft` | `graphite` | 8.6 : 1 | AAA |
| `mustang` | `ink` | 5.1 : 1 | AA (all sizes) |
| `mustang` | `coal` | 4.8 : 1 | AA (all sizes) |
| `mustang` | `graphite` | **4.4 : 1** | ✗ **fails AA** — see rule below |
| `ink` | `mustang` | 5.1 : 1 | AA — the primary button (mustang fill, ink label) |
| `ink` | `mustang-soft` | 9.9 : 1 | AAA — primary button hover |
| `bone` | `mustang-dim` | 6.6 : 1 | AA — primary button pressed |
| `danger` | `ink` | 6.4 : 1 | AA |
| `success` | `ink` | 7.7 : 1 | AAA |

**The one hard rule this palette imposes:** `mustang` is legible as *text* on `ink` and `coal`, but **not on
`graphite`**. Any accent text sitting on an elevated surface — a card, a form field, the lightbox chrome —
uses `mustang-soft` instead. Enforced by convention and checked in the Phase 8 audit.

`steel`, `iron` and `mustang-dim` are **never** used for enabled text — they are structural, or the
foreground of disabled controls (which WCAG exempts from contrast, and which are additionally marked by
`disabled`/`aria-disabled`, never by colour alone).

### Usage rules

- The accent is never a large fill except on the primary button. It appears as: 1px rules, the focus ring,
  link underlines, the eyebrow label above section headings, active nav/filter state, and that button.
- **Emphasis is brightness.** Hover states brighten (`mist` → `bone`, `mustang` → `mustang-soft`); they never
  shift hue, because there is no hue to shift to.
- No gradients on brand surfaces. The only permitted gradient is the bottom-to-top scrim over the hero image
  (`ink` at 92% → transparent) that guarantees hero text legibility regardless of the photo behind it.
- Photographs are always rendered at full opacity. No colour overlays, no duotone, no filters on the images
  themselves — she already decided what her photographs look like. This matters more than ever now that the
  chrome is neutral: the images are the only thing on screen with any tonal life.
- Pure black backgrounds and pure-black-adjacent surfaces mean **borders do a lot of work**. Where a surface
  boundary matters, draw the 1px `iron` rule; do not rely on the `ink` → `coal` step alone at low brightness.

## Typography

### Families

| Token | Stack | Use |
|---|---|---|
| `--font-sans` | `'Inter Variable', system-ui, -apple-system, 'Segoe UI', sans-serif` | All body copy, UI, labels, buttons, nav |
| `--font-display` | `'Playfair Display', 'Iowan Old Style', Georgia, serif` | Headings and accents — **always `font-style: italic`** |

Playfair Display is used **exclusively in italic**. A non-italic Playfair anywhere in the UI is a bug.
This is enforced by the base layer: the `.font-display` utility sets `font-style: italic` itself.

### Scale

Fluid, `clamp()`-based. Tokens are declared in `@theme` so they are available as `text-*` utilities.

| Token | Min → Max | Family | Weight | Line height | Tracking | Use |
|---|---|---|---|---|---|---|
| `display-xl` | 2.75rem → 5.5rem | display | 400 | 1.02 | −0.02em | Hero headline |
| `display-lg` | 2.25rem → 3.75rem | display | 400 | 1.08 | −0.015em | Page titles (`/about`, `/my-work`) |
| `display-md` | 1.75rem → 2.75rem | display | 400 | 1.15 | −0.01em | Section headings |
| `display-sm` | 1.375rem → 1.75rem | display | 500 | 1.25 | −0.005em | Card titles, sub-headings |
| `body-lg` | 1.0625rem → 1.25rem | sans | 400 | 1.65 | 0 | Lead paragraphs, hero subline |
| `body` | 1rem → 1.0625rem | sans | 400 | 1.7 | 0 | Default body |
| `body-sm` | 0.875rem | sans | 400 | 1.6 | 0 | Captions, form help text, footer |
| `label` | 0.8125rem | sans | 500 | 1.4 | 0.02em | Form labels, buttons |
| `eyebrow` | 0.75rem | sans | 500 | 1.3 | 0.18em, uppercase | The `mustang` label above section headings |

Measure: body text is capped at `max-width: 68ch` (`--measure`); lead paragraphs at `58ch`.

### Rules

- Headings never use sans. Body copy never uses display.
- Only one `display-xl` per page (the hero / page title).
- Heading hierarchy is semantic and unbroken: exactly one `<h1>` per page, no level skipped. Visual size is
  chosen with a `size` prop on `SectionHeading`, never by picking a different heading tag.
- Spanish copy runs roughly 15–25% longer than English. Every heading and button must be checked at 320px
  in Spanish; no fixed heights on text containers. Keily's supplied copy
  ([12-copy-from-keily.md](./12-copy-from-keily.md)) is Spanish-first and long — it is the real test case.

## Spacing & layout

Tailwind's default 0.25rem spacing scale is kept. Additional layout tokens:

| Token | Value | Use |
|---|---|---|
| `--container-content` | `72rem` | Standard page container max-width |
| `--container-narrow` | `48rem` | Prose columns (`/about` body) |
| `--container-wide` | `90rem` | Gallery container |
| `--gutter` | `clamp(1.25rem, 5vw, 4rem)` | Horizontal page padding |
| `--section-y` | `clamp(4.5rem, 10vw, 9rem)` | Vertical rhythm between page sections |
| `--section-y-tight` | `clamp(3rem, 6vw, 5rem)` | Between closely related blocks |

### Breakpoints

Tailwind defaults, used as-is: `sm 640` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536`.
Design is authored mobile-first. The three reference widths for review are **375**, **768**, **1440**.

### Section rhythm

Backgrounds alternate `ink` → `coal` → `ink` down the landing page to separate sections without drawing
rules everywhere. The step is deliberately small; where two adjacent sections share a background, or where
the step is not doing enough work on a dim screen, they are separated by a 1px `iron` rule inset to the
container.

## Elevation & surfaces

There are no shadows. Depth is expressed only through background lightness and 1px borders — shadows on a
black background are invisible and only cost paint time.

| Level | Background | Border |
|---|---|---|
| 0 — page | `ink` | — |
| 1 — alt section | `coal` | — |
| 2 — card / field | `graphite` | 1px `iron` |
| 3 — overlay (menu, lightbox) | `ink` at 96% + `backdrop-blur-sm` | 1px `iron` |

## Radii & borders

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | `2px` | Form fields, chips, buttons |
| `--radius-md` | `4px` | Cards |
| `--radius-none` | `0` | **Photographs — always square corners** |

Photographs are never rounded. A rounded photo reads as a UI element; a square one reads as a print.

Borders are always 1px. The only 2px stroke in the system is the focus ring.

## Focus & interaction states

**Focus ring (global, non-negotiable):**

```css
:focus-visible {
  outline: 2px solid var(--color-mustang);
  outline-offset: 2px;
  border-radius: 2px;
}
```

Never removed, never replaced by a colour change alone. `mustang` clears the 3:1 non-text requirement on
every background in the system (5.1 : 1 on `ink`, 4.4 : 1 on `graphite`). On the mustang-filled primary
button the ring switches to `bone` so it remains visible against its own background.

| Element | Rest | Hover | Active/pressed | Disabled |
|---|---|---|---|---|
| Text link | `bone`, `mustang` underline scaled to 0 | `bone` + underline scales in from left in `mustang-soft` | `mustang-soft` text | `mustang-dim`, no underline |
| Nav link | `mist` | `bone` + `mustang` underline | `bone` | — |
| Nav link (current page) | `bone` + persistent `mustang` underline | — | — | — |
| Primary button | `mustang` fill, `ink` label | `mustang-soft` fill, `ink` label | `mustang-dim` fill, `bone` label | `iron` fill, `mustang-dim` label |
| Ghost button | transparent, 1px `steel`, `bone` label | 1px `mustang-soft`, `bone` label | 1px `mustang`, `mist` label | 1px `iron`, `mustang-dim` label |
| Filter chip | 1px `iron`, `mist` label | 1px `mustang-soft`, `bone` label | — | — |
| Filter chip (active) | 1px `mustang`, `bone` label, `graphite` fill | — | — | — |
| Photo card | image at rest | image scales 1.04, caption fades in | — | — |
| Form field | 1px `iron` on `graphite` | 1px `steel` | 1px `mustang` (focus) | `mustang-dim` label, reduced opacity |
| Form field (invalid) | 1px `danger` | — | — | — |

Note the primary button's pressed state swaps its **label** to `bone`: `ink` on `mustang-dim` is 2.8 : 1 and
would fail. This is the one place in the system where a state change alters a label colour, and it is
deliberate.

Minimum hit target for every interactive element: **44 × 44 CSS px**.

## Iconography

Inline SVG components in `src/components/ui/icons/`. No icon font, no icon package.

- 24×24 viewBox, `stroke="currentColor"`, `stroke-width="1.5"`, `fill="none"`, round caps and joins.
- Brand marks (Instagram) are the official glyph, `fill="currentColor"`, and are exempt from the stroke rules.
- Every icon takes `class` and an optional `title` prop. Decorative icons render `aria-hidden="true"`;
  icons that are the only content of a control get an accessible name from the parent's `aria-label`.
- Icons at rest are `mist`; on hover they brighten to `bone`. (An icon that turned `mustang` on hover would
  get *darker* — the inverse of what a hover state should communicate.)

## Brand mark & favicon

Keily's decision: **a "K" in black on a light ground** — deliberately inverted from the site.

- `favicon.svg` · `favicon-96.png` · `apple-touch-icon.png` (180 × 180).
- The letter is `K` set in italic Playfair Display, `#000000`, on a `bone` (`#F2F1EF`) square, optically
  centred with generous padding.
- Inverting the mark is intentional: a near-black favicon disappears into dark browser chrome, and the light
  square makes the tab findable. It is also the only light surface in the entire brand.
- `<meta name="theme-color" content="#000000">` — the site itself stays black.

## `global.css` shape

```css
@import 'tailwindcss';

@theme {
  --color-ink: #000000;
  --color-coal: #0C0C0B;
  --color-graphite: #161615;
  --color-iron: #262624;
  --color-steel: #3C3B39;
  --color-mustang-dim: #565553;
  --color-mustang: #7E7D7B;
  --color-mist: #A3A19E;
  --color-mustang-soft: #B4B2AF;
  --color-bone: #F2F1EF;
  --color-danger: #E06B5A;
  --color-success: #7FA86B;

  --font-sans: 'Inter Variable', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-display: 'Playfair Display', 'Iowan Old Style', Georgia, serif;

  --text-display-xl: clamp(2.75rem, 1.6rem + 5.7vw, 5.5rem);
  --text-display-lg: clamp(2.25rem, 1.6rem + 3.2vw, 3.75rem);
  --text-display-md: clamp(1.75rem, 1.4rem + 1.8vw, 2.75rem);
  /* … remaining scale tokens … */

  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-quart: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out-soft: cubic-bezier(0.65, 0, 0.35, 1);

  --duration-fast: 180ms;
  --duration-base: 320ms;
  --duration-slow: 600ms;
  --duration-reveal: 800ms;
}

@layer base {
  html { color-scheme: dark; scroll-behavior: smooth; }
  body { background: var(--color-ink); color: var(--color-bone); font-family: var(--font-sans); }
  ::selection { background: var(--color-mustang); color: var(--color-ink); }
  :focus-visible { outline: 2px solid var(--color-mustang); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
}

@utility font-display { font-family: var(--font-display); font-style: italic; font-weight: 400; }
```
