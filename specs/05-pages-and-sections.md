# 05 · Pages & sections

Every section below is specified in the order it appears in the DOM. All copy comes from the translation
files; no string in this document is to be hard-coded in a component.

---

# `/` — Landing

Section order: **Hero → About Me → My Work → Contact Me**. Backgrounds alternate `ink` → `bark` → `ink` → `bark`.

## 1. Hero

**Purpose:** state who she is in one sentence and make the first impression a photograph.

**Layout:** full-viewport-height section, `min-height: 100svh` (small viewport height, so mobile browser
chrome does not clip it), `max-height: 900px` on desktop so it does not become absurd on tall monitors.

- Background: `hero.jpg`, `object-fit: cover`, `object-position: center`, absolutely positioned, `z-0`.
- Scrim: absolutely positioned gradient over the image — `linear-gradient(to top, ink 92%, ink/55% 45%, ink/15% 100%)`.
  This guarantees text contrast whatever photograph is used. **The scrim is required, not optional.**
- Content: bottom-left aligned on desktop (`items-end`, container gutter, `pb-[clamp(4rem,10vh,7rem)]`);
  bottom-left on mobile too, with the headline allowed to wrap to 3–4 lines.

**Content:**

| Element | Spec |
|---|---|
| `<h1>` | `t.hero.headline` — three segments, each its own `<span class="block">` for line-by-line reveal. `display-xl`, `font-display`, `linen`. The segment "photographer." is coloured `gold` — the only place gold appears at display size |
| Subline | `t.hero.subline`, `body-lg`, `sand`, `max-width: 42ch`, `mt-6` |
| CTA row | `mt-10`, flex, gap 4, wraps on mobile. Primary button `t.hero.ctaPrimary` → `#contact` (smooth scroll). Ghost button `t.hero.ctaSecondary` → `path('work', lang)` |
| Scroll hint | Bottom-centre, `eyebrow` style in `sand`, with a 1px 40px gold vertical rule beneath it that animates (see [07-motion.md](./07-motion.md#hero)). Hidden below `md`. `aria-hidden="true"` |

**Image handling:** `<Image>` with `loading="eager"`, `fetchpriority="high"`, `widths={[640, 1024, 1536, 2048, 2400]}`,
`sizes="100vw"`, `format="avif"` with WebP fallback, explicit `width`/`height` to reserve space. This image is
the LCP element and is preloaded in `<head>`.

**Header interaction:** on `/` only, the header starts transparent and gains its `bark` background past 24px scroll.

## 2. About Me

**Purpose:** a short, warm introduction with a picture of her, leading to the full `/about` page.

**Layout:** two columns at `lg` (image 5/12, text 7/12, gap 16), stacked on mobile with the image first.
Background `bark`. Vertical padding `--section-y`.

| Element | Spec |
|---|---|
| Image | `portrait.jpg`, 4:5, square corners, `width: 100%`. A 1px `gold` rule offset 16px down-right behind the image (a framing device, `::after`, hidden below `md`) |
| Eyebrow | `t.about.eyebrow`, `eyebrow` style, `gold` |
| Heading | `t.about.heading`, `<h2>`, `display-md`, `font-display`, `linen` |
| Lead | `t.about.lead`, `body-lg`, `linen`, `max-width: 58ch` |
| Body | `t.about.body[]` → 2 paragraphs, `body`, `sand`, `max-width: 68ch`, `space-y-4` |
| CTA | Ghost button `t.about.cta` → `path('about', lang)`, `mt-8` |

Image is `loading="lazy"`, `widths={[400, 600, 900, 1200]}`, `sizes="(min-width: 1024px) 40vw, 100vw"`.

## 3. My Work

**Purpose:** show her strongest work and send visitors to the full gallery.

**Layout:** background `ink`. Heading block is centred; the grid is full-container width.

| Element | Spec |
|---|---|
| Eyebrow | `t.work.eyebrow`, `gold` |
| Heading | `t.work.heading`, `<h2>`, `display-md` |
| Lead | `t.work.lead`, `body-lg`, `sand`, centred, `max-width: 52ch`, `mx-auto` |
| Grid | **Exactly 6 featured photos.** Masonry, same component as `/my-work` but with `columns={{ base: 1, sm: 2, lg: 3 }}` and no filters |
| CTA | Primary button `t.work.cta` → `path('work', lang)`, centred, `mt-12` |

If fewer than 6 photos are marked `featured`, the build fails with an explicit error rather than rendering a
short grid. If more than 6, the first 6 by `order` are used and a build warning is logged.

## 4. Contact Me

**Purpose:** the conversion point. Contact form plus social links.

**Layout:** background `bark`, `id="contact"` with `scroll-margin-top` equal to the header height so the
smooth-scroll anchor does not tuck the heading under the sticky header. Two columns at `lg`
(form 7/12, sidebar 5/12), stacked on mobile with the **form first**.

**Left — the form.** See [Contact form](#contact-form) below.

**Right — sidebar:**

| Element | Spec |
|---|---|
| Eyebrow | `t.contact.eyebrow`, `gold` |
| Heading | `t.contact.heading`, `<h2>`, `display-md` |
| Lead | `t.contact.lead`, `body`, `sand`, `max-width: 42ch` |
| Direct email | `t.contact.directEmail` + a `mailto:` link to `SITE.email`, styled as a text link |
| Socials | `t.contact.socials.heading` then the `SITE.socials` list rendered as icon + label rows, 44px min height, gold icon on hover |

---

# Contact form

Rendered by `ContactForm.astro` in the Contact section on `/` only. It does **not** appear on `/about` or
`/my-work`; those pages link to `/#contact`.

## Fields

| Field | Name | Type | Required | Constraints | Autocomplete |
|---|---|---|---|---|---|
| Name | `name` | `text` | yes | 2–80 chars, trimmed | `name` |
| Email | `email` | `email` | yes | matches `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`, ≤ 254 chars | `email` |
| Subject | `subject` | `text` | no | ≤ 120 chars | `off` |
| Message | `message` | `textarea` | yes | 10–2000 chars, 6 rows, vertically resizable only | `off` |
| Honeypot | `company` | `text` | — | Must be empty. Visually hidden, `tabindex="-1"`, `autocomplete="off"`, `aria-hidden="true"` | — |

The honeypot is included **now** even though there is no backend, so the future provider inherits basic spam
protection with no rework.

A live character counter appears under `message` once past 1800 characters (`body-sm`, `sand`; `danger` at 2000).

## Field markup requirements

- Every input has a real `<label>` bound by `for`/`id`. No placeholder-as-label.
- Required fields are marked with a gold `*` **and** `required` **and** the label text includes the
  accessible required indication via `aria-describedby` pointing at a visually-hidden `t.contact.form.required`.
- Errors: `aria-invalid="true"` on the field, error text in a `<p id="{field}-error" role="alert">` linked via
  `aria-describedby`, `danger` coloured, `body-sm`, with a small alert icon.
- No `novalidate` removal of semantics: the form carries `novalidate` so custom messages are used, but each
  input still has correct `type`, `required`, `minlength`, `maxlength` attributes for autofill and for the
  no-JS case.

## Validation behaviour

- **On submit:** validate all fields. If invalid, focus the first invalid field, render all error messages,
  and announce a summary via a `role="status"` region: `t.contact.form.errorSummary(n)`.
- **On blur:** validate that field only, but *only after* it has been touched (blurred once) — no errors while
  the user is still typing their first pass.
- **On input, after an error is shown:** re-validate that field live so the error clears as soon as it is fixed.
- Validation logic lives in `src/lib/validation.ts` as pure functions returning a translation key, so messages
  are localised at render time, not baked into the validator.

## States

| State | UI |
|---|---|
| `idle` | Form as authored. Submit button enabled |
| `submitting` | Button label swaps to `t.contact.form.submitting`, button disabled + `aria-busy="true"`, an inline spinner appears, all fields `readonly` (not `disabled`, so values remain announced) |
| `success` | The form element is replaced by a success panel: gold check icon, `t.contact.form.success.heading` (`display-sm`), `t.contact.form.success.body`, and a ghost button `t.contact.form.success.again` that restores the empty form. Focus is moved to the panel heading (`tabindex="-1"`). The panel is `role="status"` |
| `error` | A `danger`-bordered alert appears **above** the submit button with `t.contact.form.error.heading` / `.body` and a retry affordance. The form retains all values. `role="alert"`, focus moved to the alert |

## The submit seam — `src/lib/contact.ts`

There is no backend. The submit path is complete and real up to a single documented boundary:

```ts
export type ContactPayload = {
  name: string;
  email: string;
  subject?: string;
  message: string;
  /** Honeypot. Non-empty means bot; caller drops the submission silently. */
  company: string;
  /** Locale the form was submitted in, so a future backend can reply in-language. */
  lang: Lang;
};

export type ContactResult = { ok: true } | { ok: false; reason: 'network' | 'server' | 'validation' };

/**
 * TODO(backend): replace this stub with a real POST to the chosen form provider.
 * Contract: resolve `{ ok: true }` on success; never throw — map every failure to a
 * ContactResult so the UI can render `t.contact.form.error.*`.
 *
 * The rest of the form (validation, states, a11y, honeypot, i18n) is production-ready
 * and requires no changes when this function is implemented.
 */
export async function submitContact(payload: ContactPayload): Promise<ContactResult>;
```

**Stub behaviour:** waits 900ms (so the `submitting` state is genuinely exercised), logs the payload with
`console.info('[contact] stubbed submission', payload)`, and resolves `{ ok: true }`. If the honeypot is
non-empty it resolves `{ ok: true }` **without** logging — bots get a success page, exactly as the real
implementation should behave.

To exercise the error state during development, appending `?contact=fail` to the URL makes the stub resolve
`{ ok: false, reason: 'server' }`. This is documented in the README and costs three lines.

## No-JS behaviour

With JavaScript disabled the form renders and native browser validation applies, but submission cannot work
(there is no action endpoint). In that case the `<noscript>` block inside the contact section shows
`t.contact.directEmail` and the `mailto:` link prominently. The form itself is not hidden.

---

# `/about`

Background `ink` throughout. Container `--container-content`, prose column `--container-narrow`.

| Section | Spec |
|---|---|
| Page header | `<h1>` `t.about.page.title`, `display-lg`, `font-display`. Eyebrow above it in `gold`. Top padding accounts for the sticky header |
| Lead | `t.about.page.lead`, `body-lg`, `linen`, `max-width: 58ch` |
| Portrait | `portrait.jpg`, 4:5. On `lg` it floats right of the lead in a 2-column arrangement; on mobile it sits full-width between lead and body |
| Body | `t.about.page.body[]` → 4–6 paragraphs, `body`, `sand`, `max-width: 68ch`, `space-y-5`. First paragraph has no indent; there are no drop caps |
| Secondary image | `about-secondary.jpg`, 3:2, full container width, with a `body-sm` `sand` caption beneath |
| Facts list | `t.about.page.factsHeading` (`display-sm`) + a `<dl>` of label/value rows separated by 1px `cocoa` rules. Labels `sand` `label`-size uppercase-tracked; values `linen` `body`. Expected rows: Based in · Working since · Shoots · Speaks · Equipment (final list confirmed by Keily) |
| Closing CTA | Full-width band, background `bark`, centred: a `display-md` line and a primary button to `/#contact` |

## `/my-work`

| Section | Spec |
|---|---|
| Page header | `<h1>` `t.work.page.title`, `display-lg`. Eyebrow in `gold`. Lead `t.work.page.lead`, `body-lg`, `sand`, `max-width: 58ch` |
| Filters | **Gated on [open decision #1](./09-open-decisions.md#1--gallery-organisation).** When enabled: a horizontally scrollable row of `Chip` controls, "All" first and active by default, each showing a count. Implemented as `<button>`s in a `role="group"` with `aria-pressed`; the active filter is also written to the URL as `?filter=slug` so a filtered view is linkable and survives reload |
| Gallery | `MasonryGallery`, all non-draft photos, `columns={{ base: 1, sm: 2, lg: 3, xl: 3 }}`, container `--container-wide` |
| Count | `t.work.photoCount(n)` under the filters, `body-sm`, `sand`, in an `aria-live="polite"` region so filtering is announced |
| Footer CTA | Band with background `bark`: a line inviting contact + primary button to `/#contact` |

**Empty state:** if a filter yields zero photos (only reachable via a hand-edited URL), show a `sand`
`body` message and a "show all" ghost button. The URL filter param is validated against known slugs and
falls back to "all" if unknown.

## Gallery mechanics (shared)

- **Masonry via CSS columns** — `columns-1 sm:columns-2 lg:columns-3`, `gap` from the spacing scale,
  each item `break-inside-avoid mb-{gap}`. No JS layout, no library, no cumulative layout shift.
- **Column-order caveat, accepted:** CSS columns fill top-to-bottom per column, so visual order is not DOM
  order across columns. This is acceptable because gallery order is curatorial, not sequential. **DOM order
  remains the correct reading order** for screen readers and keyboard users, which is what matters.
- Every photo renders at its native aspect ratio. **No cropping anywhere in the gallery.**
- Each `<Image>`: `widths={[400, 700, 1000, 1400]}`, `sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"`,
  `format="avif"`, explicit `width`/`height`.
- Loading: the first 3 photos are `loading="eager"`; everything else `loading="lazy"` with `decoding="async"`.
- Hover (pointer devices only, `@media (hover: hover)`): image scales to 1.04 over 600ms; if the photo has a
  `title`, it fades in bottom-left over a bottom-anchored `ink`→transparent scrim, `body-sm`, `linen`.
- Touch devices show the title permanently beneath the image instead of on hover.
- Click behaviour is **[open decision #2](./09-open-decisions.md#2--photo-click-behaviour)**. Until it is
  answered, `PhotoCard` renders a non-interactive `<figure>`; the `interaction` prop is the single seam where
  the answer plugs in.
