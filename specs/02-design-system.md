# 02 · Design system

## Design principle

The photographs are black and white. **The interface therefore contributes no colour competition and no
visual noise.** Every surface is a dark brown; every piece of text is a warm off-white or a muted sand;
gold appears only where the eye is meant to go next. If a decision is ambiguous, choose the quieter option.

Second principle: **generous negative space**. Dark backgrounds with lots of air make monochrome images
feel like prints on a wall rather than tiles on a screen.

## Colour

### Palette

All values are exact. Names are used verbatim as Tailwind token names.

| Token | Hex | Role |
|---|---|---|
| `ink` | `#0E0A08` | Page background. Almost-black brown, the predominant colour of the site |
| `bark` | `#17100C` | Alternating section background, header when scrolled |
| `umber` | `#241812` | Cards, form fields, lightbox chrome, elevated surfaces |
| `cocoa` | `#3A2A20` | Borders, dividers, hairlines |
| `clay` | `#5C4636` | Stronger borders, disabled foreground, form field borders on hover |
| `sand` | `#A8927E` | Secondary/muted body text, captions, labels |
| `linen` | `#EDE6DE` | Primary text, headings |
| `gold` | `#C9A227` | Accent: links, active states, focus rings, rules, eyebrow text |
| `gold-soft` | `#E3C765` | Accent hover / lighter accent on dark surfaces |
| `gold-dim` | `#8A6F1C` | Accent pressed state, subdued accent rules |
| `danger` | `#E06B5A` | Form validation errors (desaturated so it stays in-family) |
| `success` | `#7FA86B` | Form success state (desaturated) |

### Semantic aliases

| Alias | Value |
|---|---|
| `--color-bg` | `ink` |
| `--color-bg-alt` | `bark` |
| `--color-surface` | `umber` |
| `--color-border` | `cocoa` |
| `--color-border-strong` | `clay` |
| `--color-text` | `linen` |
| `--color-text-muted` | `sand` |
| `--color-accent` | `gold` |

### Verified contrast ratios

All combinations used in the design, measured against WCAG 2.1:

| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| `linen` | `ink` | 15.8 : 1 | AAA |
| `linen` | `umber` | 14.3 : 1 | AAA |
| `sand` | `ink` | 6.6 : 1 | AA (all sizes) |
| `sand` | `umber` | 5.8 : 1 | AA (all sizes) |
| `gold` | `ink` | 8.1 : 1 | AAA |
| `gold` | `umber` | 7.1 : 1 | AAA |
| `ink` | `gold` | 8.1 : 1 | AAA — used for the primary button (gold fill, ink label) |

`clay` and `cocoa` are **never** used for text — they are structural only.

### Usage rules

- Gold is never used as a large fill except on the primary button. It appears as: 1px rules, the focus ring,
  link underlines, the eyebrow label above section headings, active nav/filter state, and the primary button.
- Never place gold text on `bark` at sizes below 16px without re-verifying contrast.
- No gradients on brand surfaces. The only permitted gradient is the bottom-to-top scrim over the hero image
  (`ink` at 90% → transparent) that guarantees hero text legibility regardless of the photo behind it.
- Photographs are always rendered at full opacity. No colour overlays, no duotone, no filters on the images
  themselves — she already decided what her photographs look like.

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
| `eyebrow` | 0.75rem | sans | 500 | 1.3 | 0.18em, uppercase | The gold label above section headings |

Measure: body text is capped at `max-width: 68ch` (`--measure`); lead paragraphs at `58ch`.

### Rules

- Headings never use sans. Body copy never uses display.
- Only one `display-xl` per page (the hero / page title).
- Heading hierarchy is semantic and unbroken: exactly one `<h1>` per page, no level skipped. Visual size is
  chosen with a `size` prop on `SectionHeading`, never by picking a different heading tag.
- Spanish copy runs roughly 15–25% longer than English. Every heading and button must be checked at 320px
  in Spanish; no fixed heights on text containers.

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

Backgrounds alternate `ink` → `bark` → `ink` down the landing page to separate sections without drawing
rules everywhere. Where two adjacent sections share a background, they are separated by a 1px `cocoa` rule
inset to the container.

## Elevation & surfaces

There are no shadows. Depth is expressed only through background lightness and 1px borders — shadows on a
near-black background are invisible and only cost paint time.

| Level | Background | Border |
|---|---|---|
| 0 — page | `ink` | — |
| 1 — alt section | `bark` | — |
| 2 — card / field | `umber` | 1px `cocoa` |
| 3 — overlay (menu, lightbox) | `ink` at 96% + `backdrop-blur-sm` | 1px `cocoa` |

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
  outline: 2px solid var(--color-gold);
  outline-offset: 2px;
  border-radius: 2px;
}
```

Never removed, never replaced by a colour change alone. On the gold-filled primary button the ring switches
to `linen` so it remains visible against its own background.

| Element | Rest | Hover | Active/pressed | Disabled |
|---|---|---|---|---|
| Text link | `linen`, gold underline scaled to 0 | `gold`, underline scales in from left | `gold-dim` | `clay`, no underline |
| Nav link | `sand` | `linen` + gold underline | `linen` | — |
| Nav link (current page) | `linen` + persistent gold underline | — | — | — |
| Primary button | `gold` fill, `ink` label | `gold-soft` fill | `gold-dim` fill | `cocoa` fill, `clay` label |
| Ghost button | transparent, 1px `clay`, `linen` label | 1px `gold`, `gold` label | `gold-dim` border | 1px `cocoa`, `clay` label |
| Photo card | image at rest | image scales 1.04, caption fades in | — | — |
| Form field | 1px `cocoa` on `umber` | 1px `clay` | 1px `gold` (focus) | `clay` label, reduced opacity |
| Form field (invalid) | 1px `danger` | — | — | — |

Minimum hit target for every interactive element: **44 × 44 CSS px**.

## Iconography

Inline SVG components in `src/components/ui/icons/`. No icon font, no icon package.

- 24×24 viewBox, `stroke="currentColor"`, `stroke-width="1.5"`, `fill="none"`, round caps and joins.
- Brand marks (Instagram) are the official glyph, `fill="currentColor"`, and are exempt from the stroke rules.
- Every icon takes `class` and an optional `title` prop. Decorative icons render `aria-hidden="true"`;
  icons that are the only content of a control get an accessible name from the parent's `aria-label`.

## `global.css` shape

```css
@import 'tailwindcss';

@theme {
  --color-ink: #0E0A08;
  --color-bark: #17100C;
  --color-umber: #241812;
  --color-cocoa: #3A2A20;
  --color-clay: #5C4636;
  --color-sand: #A8927E;
  --color-linen: #EDE6DE;
  --color-gold: #C9A227;
  --color-gold-soft: #E3C765;
  --color-gold-dim: #8A6F1C;
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
  body { background: var(--color-ink); color: var(--color-linen); font-family: var(--font-sans); }
  ::selection { background: var(--color-gold); color: var(--color-ink); }
  :focus-visible { outline: 2px solid var(--color-gold); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
}

@utility font-display { font-family: var(--font-display); font-style: italic; font-weight: 400; }
```
