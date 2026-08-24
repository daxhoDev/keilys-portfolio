# 05 · Pages & sections

Every section below is specified in the order it appears in the DOM. All copy comes from the translation
files; no string in this document is to be hard-coded in a component.

---

# `/` — Landing

Section order: **Hero → About Me → My Work → Contact Me**. Backgrounds alternate `ink` → `coal` → `ink` → `coal`.

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
| `<h1>` | `t.hero.headline` — three segments, each its own `<span class="block">` for line-by-line reveal. `display-xl`, `font-display`, `bone`. The third segment ("fotógrafa." / "photographer.") is `mustang-soft` with a 1px `mustang` underline that draws in as part of the hero timeline — the only place the accent appears at display size |
| Subline | `t.hero.subline`, `body-lg`, `mist`, `max-width: 42ch`, `mt-6` |
| CTA row | `mt-10`, flex, gap 4, wraps on mobile. Primary button `t.hero.ctaPrimary` → `#contact` (smooth scroll). Ghost button `t.hero.ctaSecondary` → `path('work', lang)` |
| Scroll hint | Bottom-centre, `eyebrow` style in `mist`, with a 1px 40px mustang vertical rule beneath it that animates (see [07-motion.md](./07-motion.md#hero)). Hidden below `md`. `aria-hidden="true"` |

**Image handling:** `<Image>` with `loading="eager"`, `fetchpriority="high"`, `widths={[640, 1024, 1536, 2048, 2400]}`,
`sizes="100vw"`, `format="avif"` with WebP fallback, explicit `width`/`height` to reserve space. This image is
the LCP element and is preloaded in `<head>`.

**Header interaction:** on `/` only, the header starts transparent and gains its `coal` background past 24px scroll.

## 2. About Me

**Purpose:** a short, warm introduction with a picture of her, leading to the full `/about` page.

**Layout:** two columns at `lg` (image 5/12, text 7/12, gap 16), stacked on mobile with the image first.
Background `coal`. Vertical padding `--section-y`.

| Element | Spec |
|---|---|
| Image | `portrait.jpg`, 4:5, square corners, `width: 100%`. A 1px `mustang` rule offset 16px down-right behind the image (a framing device, `::after`, hidden below `md`) |
| Eyebrow | `t.about.eyebrow`, `eyebrow` style, `mustang` |
| Heading | `t.about.heading`, `<h2>`, `display-md`, `font-display`, `bone` |
| Lead | `t.about.lead`, `body-lg`, `bone`, `max-width: 58ch` |
| Body | `t.about.body[]` → 2 paragraphs, `body`, `mist`, `max-width: 68ch`, `space-y-4` |
| CTA | Ghost button `t.about.cta` → `path('about', lang)`, `mt-8` |

Image is `loading="lazy"`, `widths={[400, 600, 900, 1200]}`, `sizes="(min-width: 1024px) 40vw, 100vw"`.

## 3. My Work

**Purpose:** show her strongest work and send visitors to the full gallery.

**Layout:** background `ink`. Heading block is centred; the grid is full-container width.

| Element | Spec |
|---|---|
| Eyebrow | `t.work.eyebrow`, `mustang` |
| Heading | `t.work.heading`, `<h2>`, `display-md` |
| Lead | `t.work.lead`, `body-lg`, `mist`, centred, `max-width: 52ch`, `mx-auto` |
| Grid | **Exactly 6 featured photos.** Masonry, same component as `/my-work` but with `columns={{ base: 1, sm: 2, lg: 3 }}` and no filters |
| CTA | Primary button `t.work.cta` → `path('work', lang)`, centred, `mt-12` |

If fewer than 6 photos are marked `featured`, the build fails with an explicit error rather than rendering a
short grid. If more than 6, the first 6 by `order` are used and a build warning is logged.

## 4. Contact Me

**Purpose:** the conversion point. Contact form plus social links.

**Layout:** background `coal`, `id="contact"` with `scroll-margin-top` equal to the header height so the
smooth-scroll anchor does not tuck the heading under the sticky header. Two columns at `lg`
(form 7/12, sidebar 5/12), stacked on mobile with the **form first**.

**Left — the form.** See [Contact form](#contact-form) below.

**Right — sidebar:**

| Element | Spec |
|---|---|
| Eyebrow | `t.contact.eyebrow`, `mustang` |
| Heading | `t.contact.heading`, `<h2>`, `display-md` |
| Lead | `t.contact.lead`, `body`, `mist`, `max-width: 42ch` |
| Direct email | `t.contact.directEmail` + a **plain, visible `mailto:`** link to `SITE.email`, styled as a text link. No JavaScript obfuscation, no image, no "click to reveal" ([decision 5.5](./09-open-decisions.md#5--delivery--launch-decisions)) — in v1 the form does not deliver, so this link is the only working contact path and must survive JS being off |
| Socials | `t.contact.socials.heading` then the `SITE.socials` list rendered as icon + label rows, 44px min height. Icons `mist` → `bone` on hover. **Three rows:** Instagram · galería, Instagram · personal, and email — the two Instagram rows share an icon and must not share a label |

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

A live character counter appears under `message` once past 1800 characters (`body-sm`, `mist`; `danger` at 2000).

## Field markup requirements

- Every input has a real `<label>` bound by `for`/`id`. No placeholder-as-label.
- Required fields are marked with a `mustang-soft` `*` **and** `required` **and** the label text includes the
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
| `success` | The form element is replaced by a success panel: `success`-coloured check icon, `t.contact.form.success.heading` (`display-sm`), `t.contact.form.success.body`, and a ghost button `t.contact.form.success.again` that restores the empty form. Focus is moved to the panel heading (`tabindex="-1"`). The panel is `role="status"` |
| `error` | A `danger`-bordered alert appears **above** the submit button with `t.contact.form.error.heading` / `.body` and a retry affordance. The form retains all values. `role="alert"`, focus moved to the alert |

## The submit seam (`src/lib/contact.ts`)

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

**This is what ships at launch** ([decision #4](./09-open-decisions.md#4--contact-form-delivery-resolved-stub-at-launch)):
the form is complete and correct, and it delivers nothing. The visible `mailto:` beside it is the real
contact path until the backend lands.

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
| Page header | `<h1>` `t.about.page.title`, `display-lg`, `font-display`. Eyebrow above it in `mustang`. Top padding accounts for the sticky header |
| Lead | `t.about.page.lead`, `body-lg`, `bone`, `max-width: 58ch` |
| Portrait | `portrait.jpg`, 4:5. On `lg` it floats right of the lead in a 2-column arrangement; on mobile it sits full-width between lead and body |
| Body | `t.about.page.body[]` → 4–6 paragraphs, `body`, `mist`, `max-width: 68ch`, `space-y-5`. First paragraph has no indent; there are no drop caps |
| Secondary image | `about-secondary.jpg`, 3:2, full container width, with a `body-sm` `mist` caption beneath |
| Facts list | `t.about.page.factsHeading` (`display-sm`) + a `<dl>` of label/value rows separated by 1px `iron` rules. Labels `mist` `label`-size uppercase-tracked; values `bone` `body`. Five rows, values in [12-copy-from-keily.md](./12-copy-from-keily.md#facts-list-taboutpagefacts): Con base en *Holguín* · Trabajando desde *2020* · Fotografío *Calle, mar, animales, eventos culturales, personas* · Idiomas *Español e Inglés* · Equipo *Canon PowerShot SX400 IS*. Provisional — she left the question blank, which is read as accepting the proposal |
| Closing CTA | Full-width band, background `coal`, centred: a `display-md` line and a primary button to `/#contact` |

## `/my-work`

| Section | Spec |
|---|---|
| Page header | `<h1>` `t.work.page.title`, `display-lg`. Eyebrow in `mustang`. Lead `t.work.page.lead`, `body-lg`, `mist`, `max-width: 58ch` |
| Filters | A horizontally scrollable row of three `Chip` controls — **`Todas` · `Blanco y negro` · `Color`** ([decision #1 = D](./09-open-decisions.md#1--gallery-organisation-resolved-d-tone)), "Todas" first and active by default, each showing its count. `<button>`s in a `role="group"` labelled by `t.work.filters.label`, with `aria-pressed`. The active filter is written to the URL as `?filter=bw` / `?filter=colour` (`all` writes no param) so a filtered view is linkable and survives reload |
| Gallery | `MasonryGallery`, all non-draft photos, `columns={{ base: 1, sm: 2, lg: 3, xl: 3 }}`, container `--container-wide` |
| Count | `t.work.photoCount(n)` under the filters, `body-sm`, `mist`, in an `aria-live="polite"` region so filtering is announced |
| Footer CTA | Band with background `coal`: a line inviting contact + primary button to `/#contact` |

**Empty state:** if a filter yields zero photos, show `t.work.filters.empty` in `mist` `body` and a
`t.work.filters.showAll` ghost button. The URL filter param is validated against `all` | `bw` | `colour`
and falls back to `all` if unknown.

With the tone filter this state is **reachable without a hand-edited URL**: if every photograph she sends is
black and white, the *Color* chip empties. Two consequences, both required:

- A chip whose count is 0 is rendered `disabled` with its count shown, not hidden — a filter row that
  changes shape depending on the content reads as a bug, and hiding it would silently drop the fact that
  the colour work is missing.
- If **all** photos share one tone, the entire filter row is omitted and the gallery renders unfiltered.
  One chip plus a disabled one is not a choice, it is decoration.

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
  `title`, it fades in bottom-left over a bottom-anchored `ink`→transparent scrim, `body-sm`, `bone`.
- Touch devices show the title permanently beneath the image instead of on hover.
- **Clicking a photo opens the lightbox** ([decision #2 = A](./09-open-decisions.md#2--photo-click-behaviour-resolved-a-custom-lightbox)).
  `PhotoCard` is rendered with `interaction="lightbox"` in both the featured grid on `/` and the full
  gallery, so the card is a `<button>` wrapping the figure. The complete build spec — dialog semantics,
  keyboard, focus, touch, `inert`, motion, announcements, preloading — is in
  [09-open-decisions.md](./09-open-decisions.md#build-spec-for-the-lightbox).
- **Filtering and the lightbox share one source of truth.** With a tone filter active, the lightbox's
  previous/next and its counter operate over the *filtered* set, not the full one.
- **Widths are clamped to each file's native size** via `responsiveWidths()` — some of Keily's photographs
  are under 2400px and nothing is ever upscaled. See
  [04-content-model.md](./04-content-model.md#photographs-smaller-than-2400px).
