# 07 · Motion

Motion level: **Expressive** (locked decision). The site should feel like something is being unveiled, but
never like it is showing off. Rules of thumb: motion is always *entrance and emphasis*, never decoration;
nothing loops forever except the two ambient hints below; nothing moves more than ~40px.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances — fast start, long soft settle |
| `--ease-out-quart` | `cubic-bezier(0.22, 1, 0.36, 1)` | Hover scales, panel slides |
| `--ease-in-out-soft` | `cubic-bezier(0.65, 0, 0.35, 1)` | Colour and opacity transitions |
| `--duration-fast` | `180ms` | Colour, underline, focus |
| `--duration-base` | `320ms` | Header state, menu, button fills |
| `--duration-slow` | `600ms` | Image hover scale, section reveal |
| `--duration-reveal` | `800ms` | Hero headline lines |

Only `transform` and `opacity` are ever animated. Animating `width`, `height`, `top`, `left`,
`background-position`, or `filter` is forbidden — they force layout or paint on every frame.

## Hero

Fires once, on load, without waiting for the IntersectionObserver.

| Element | From | To | Duration | Easing | Delay |
|---|---|---|---|---|---|
| Hero image | `scale(1.06)`, `opacity 0` | `scale(1)`, `opacity 1` | 1200ms | `--ease-out-expo` | 0 |
| Headline line 1 | `translateY(100%)` inside an `overflow:hidden` mask | `translateY(0)` | 800ms | `--ease-out-expo` | 200ms |
| Headline line 2 | same | same | 800ms | same | 290ms |
| Headline line 3 | same | same | 800ms | same | 380ms |
| Subline | `translateY(16px)`, `opacity 0` | rest | 700ms | `--ease-out-expo` | 560ms |
| CTA row | `translateY(16px)`, `opacity 0` | rest | 700ms | `--ease-out-expo` | 660ms |
| Scroll hint | `opacity 0` | `opacity 1` | 600ms | linear | 1000ms |

**Line masking:** each headline segment is `<span class="block overflow-hidden"><span class="block">…</span></span>`.
The inner span translates; the outer clips. The `overflow: hidden` must have enough vertical padding
(`pb-[0.14em]`) that Playfair's italic descenders and the long `y`/`g` tails are not clipped at rest — this is
the single most common way this effect goes wrong.

**FOUC guard:** the initial hidden state is applied by CSS on `[data-hero]` only when the `<html>` element
carries the `js` class, which is set by a tiny inline script in `<head>`. Without JS the hero renders fully
visible with no animation. Content is never hidden by a script that might not run.

**Scroll hint ambient loop:** the 40px vertical gold rule under the scroll hint has a 1.8px travelling
highlight — `background-position` is forbidden, so it is implemented as a 1px × 12px `gold` pseudo-element
translating from `translateY(0)` to `translateY(28px)` and fading out, 2.4s, `ease-in-out`, infinite.
Stops entirely once the user has scrolled past 10% of the viewport.

## Parallax

Applies to the hero image only.

- `factor: 0.15` — the image translates at 15% of scroll distance, i.e. `translate3d(0, scrollY * 0.15, 0)`.
- Single `scroll` listener, `{ passive: true }`, rAF-throttled to one write per frame.
- Disabled when `scrollY > innerHeight` (the hero is off-screen — stop doing work).
- Disabled entirely below `md` (768px). Parallax on touch scroll is janky and mobile is where the frame
  budget is tightest.
- The hero image element is 115% of its container height with `top: -7.5%`, so parallax never reveals a gap
  at either edge.
- `will-change: transform` is set on the image **only while a scroll is in progress**, and removed 200ms after
  scrolling stops, so the layer is not promoted permanently.

## Section reveal

Every major block on every page — headings, paragraphs, images, the form, the CTA bands.

- `translateY(24px)` + `opacity: 0` → rest. 600ms, `--ease-out-expo`.
- One shared `IntersectionObserver`: `threshold: 0.15`, `rootMargin: '0px 0px -8% 0px'`. Each element is
  unobserved after it fires — reveals happen once, never on scroll-back.
- Within a section, direct children stagger by **80ms**, capped at 5 steps (`min(index, 4) * 80ms`) so a long
  list never ends up with a two-second tail.
- Same FOUC guard as the hero: hidden state gated on `.js` on `<html>`.

## Gallery entrance

- Items stagger by **60ms** in DOM order, capped at 8 steps.
- Because the gallery uses CSS columns, stagger by DOM order reads as a soft cascade rather than a strict
  left-to-right sweep. This is intentional and looks better than trying to correct for column order.
- Each item: `translateY(20px) scale(0.98)`, `opacity 0` → rest. 700ms, `--ease-out-expo`.
- Items already in the viewport on load animate immediately; the observer handles the rest.
- **Never** animate `filter` on photographs.

## Hover & focus

| Target | Effect |
|---|---|
| Photo card | Inner `<img>` `scale(1.04)`, 600ms `--ease-out-quart`. Wrapper is `overflow: hidden`. Caption scrim + text fade in over 320ms |
| Text link | Gold underline: a 1px `::after` at the baseline, `transform: scaleX(0)` → `scaleX(1)`, `transform-origin: left`, 180ms `--ease-out-quart`. On mouse-out it scales out to the **right** (origin flips), which reads as the line leaving rather than rewinding |
| Nav link | Same underline, plus colour `sand` → `linen`, 180ms |
| Primary button | Background `gold` → `gold-soft`, 180ms. `scale(0.985)` on `:active`, 100ms |
| Ghost button | Border and label `clay`/`linen` → `gold`/`gold`, 180ms |
| Filter chip | Border `cocoa` → `gold`, 180ms. Active chip has a `gold` border and `gold` label, no transition needed |
| Social icon | Colour `sand` → `gold`, 180ms |

All hover effects are wrapped in `@media (hover: hover) and (pointer: fine)` so touch devices do not get
sticky hover states.

## View transitions

`ClientRouter` from `astro:transitions` in `BaseLayout`.

- Default cross-fade, 300ms, `--ease-in-out-soft`.
- The header and footer carry `transition:persist` so they do not flash between pages.
- The scroll position resets to top on navigation (Astro's default), except for same-page hash links.
- On navigation, `astro:page-load` re-runs every client script's `init()`; each `init()` first tears down any
  listener it previously registered.
- **Reduced motion:** view transitions are disabled entirely — `ClientRouter` still handles routing but the
  animation is suppressed via the reduced-motion block below.

## Smooth scroll

`html { scroll-behavior: smooth }` for in-page anchors (`#contact`). The `#contact` target carries
`scroll-margin-top: var(--header-height)` so the heading is not hidden under the sticky header.
Disabled under reduced motion.

## Reduced motion

A single authoritative block. **Every** animation in this document is covered by it — if a new animation is
added and is not disabled here, that is a bug.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  [data-reveal], [data-hero] * { opacity: 1 !important; transform: none !important; }
  [data-parallax] { transform: none !important; }
}
```

JavaScript additionally checks `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and:
- skips registering the parallax scroll listener entirely,
- fires all reveals immediately instead of observing,
- skips the hero timeline.

The media query is re-evaluated on `change`, so a user toggling the OS setting mid-session gets the right
behaviour without a reload.

## Performance guardrails

| Guardrail | Rule |
|---|---|
| Listeners | At most **two** global scroll listeners site-wide (`scroll-header`, `parallax`), both passive and rAF-throttled |
| Observers | Exactly **one** IntersectionObserver, shared by reveals and gallery items |
| Layer promotion | `will-change` is applied transiently, never as a static style |
| Frame budget | No animation may cause layout. Verified by recording a scroll of `/` in DevTools Performance and confirming no purple "Layout" bars during animation |
| Long tasks | No script may block the main thread > 50ms on load |
