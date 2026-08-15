# 09 · Open decisions

Two questions are unanswered. Each is recorded here with its options, its cost, what it blocks, and the
**deadline** — the phase in [11-implementation-plan.md](./11-implementation-plan.md) that cannot start
without it.

**Neither has been decided.** Both concern the gallery, and the architecture keeps each one cheap to answer
late — the design work here was to make sure a late answer costs hours, not days.

| # | Question | Blocks | Deadline | Status |
|---|---|---|---|---|
| 1 | How is the gallery organised / filtered? | `GalleryFilters`, work page header | Phase 5 | **Open** |
| 2 | What happens when a visitor clicks a photo? | `PhotoCard.interaction`, `Lightbox` | Phase 5 | **Open** |
| 3 | i18n URL scheme | Page file locations, `ROUTES` | Phase 2 | ✅ **Resolved** — see below |

---

## 1 · Gallery organisation

**Context:** Keily shoots many subjects, and her work is predominantly black and white. Genre labels
("Portraits", "Nature") fit a commercial photographer with distinct service lines; they fit a cohesive
monochrome body of work less well.

### Options

| Option | What the visitor sees | Cost | Trade-off |
|---|---|---|---|
| **A · Series / collections** | Filter chips of named bodies of work: *All · Quiet Rooms · Streetlight · Coastline* | +`GalleryFilters`, +`series.ts` labels, ~0.5 day | Reads as an artist's practice. Requires Keily to actually name and group her work — real curatorial effort, and it is work only she can do |
| **B · Subject categories** | Filter chips by subject: *All · Portraits · Street · Nature · Events* | Same components as A, ~0.5 day | Instantly understandable, useful to a client scanning for "does she shoot weddings". Slices a cohesive body of work into buckets that may not mean much |
| **C · One continuous stream** | No filters. A single curated masonry flow in a deliberate order | **Zero.** Ship the gallery as already specified | Purest presentation, least maintenance, and honest for a body of work under ~50 photos. Becomes hard to navigate past ~60 photos |
| **D · Tone: B&W / Colour** | Two chips: *Black & White · Colour* | Same as A, ~0.5 day | Honest to how her work actually splits, and requires no curatorial naming. But it filters on a property visitors can already see at a glance, which is weak justification for a control |

### What is already true regardless

The content schema in [04-content-model.md](./04-content-model.md) carries `series`, `tags` **and** `tone`
on every photo. Placeholder entries populate all three. So photo metadata can be authored today and any
option above becomes purely a UI change.

### If undecided by Phase 5

Build **C**. It is the zero-cost option, it is a legitimate final answer rather than a placeholder, and A, B
or D can be added later as an additive change: one component, one script, one heading row. Nothing built for
C has to be undone.

### Recommendation

**A**, if Keily is willing to name three to five bodies of work. It is the option that makes the site feel
like an artist's site rather than a service listing, and it is the strongest fit for a monochrome practice.
If naming the series turns into a stalling point, **C** — an unfiltered, well-sequenced gallery is a
completely respectable answer and many excellent photographer sites ship exactly that.

---

## 2 · Photo click behaviour

### Options

| Option | Cost | Trade-off |
|---|---|---|
| **A · Custom lightbox** (vanilla, no library) | ~1 day including a11y | Visitors can see the work large — the single most valuable thing on a photography site. ~3KB JS. Full modal accessibility is the real work, and it must be done properly |
| **B · PhotoSwipe** | ~0.3 day | Pinch-zoom, animated open-from-thumbnail, battle-tested a11y. But ~40KB JS, which is >100% of the current `/` budget, and a third-party dependency in an otherwise dependency-free build |
| **C · Not clickable** | **Zero** | Fastest, zero JS. Visitors can never see anything larger than a grid thumbnail — on a photography portfolio this is a genuine loss |
| **D · Detail page per photo** | ~1 day | Each photo gets a real URL, indexable, shareable, with room for a story. Heavy for a large gallery, adds a route and per-photo copy in two languages, and turns browsing into a navigation task |

### What is already true regardless

`PhotoCard` takes a single `interaction: 'none' | 'lightbox' | 'link'` prop. That prop is the **entire**
surface area of this decision — the gallery, layout, image handling, hover states, and stagger all stay
identical. Photo entries already have an unused Markdown body, reserved for D.

### Full spec for option A, if chosen

So it can be built without another round of questions:

- **Trigger:** `PhotoCard` renders `<button>` wrapping the figure, `aria-haspopup="dialog"`, accessible name
  = the photo's localised `title`, or its `alt` if untitled.
- **Dialog:** a single `<div role="dialog" aria-modal="true" aria-label={t.lightbox.…}>` appended once to the
  page, not one per photo. Level-3 surface: `ink` at 96% + `backdrop-blur-sm`.
- **Image:** `<Image>` at `widths={[900, 1400, 2000]}`, `sizes="90vw"`, `object-fit: contain`, capped at
  `90vw × 82vh` so the caption always has room. Never upscaled beyond native size.
- **Chrome:** close button top-right (44×44, `linen` → `gold` on hover); prev/next buttons vertically centred
  at each edge on `md+`, and as a bottom bar on mobile; counter `t.lightbox.counter(i, n)` bottom-centre;
  the photo's `title` and `caption` bottom-left, `body-sm`, `sand`.
- **Keyboard:** `Esc` closes · `←`/`→` navigate · `Tab` cycles within the dialog only (focus trap) · focus
  moves to the close button on open · focus returns to the originating thumbnail on close.
- **Touch:** horizontal swipe navigates (threshold 50px), vertical swipe-down closes. Implemented with
  pointer events, not a gesture library.
- **Page behind:** `inert` + scroll locked with scrollbar-width compensation so the page does not shift.
- **Motion:** overlay fades 240ms; the image scales `0.96 → 1` with a 240ms fade. Under reduced motion,
  opacity only, no scale.
- **Announcement:** an `aria-live="polite"` region announces the counter and title on each navigation.
- **Preloading:** the next and previous full-size images are prefetched once the lightbox opens.
- **No URL change.** The lightbox does not push history. `Esc` and browser-back therefore behave predictably.
  (If a shareable per-photo URL is wanted, that is option D, not a bolt-on to A.)

### If undecided by Phase 5

Build **C** (`interaction="none"`) and revisit. It ships a complete, correct gallery, and switching to A
later touches exactly one prop plus the new component.

### Recommendation

**A.** Not being able to enlarge a photograph on a photography portfolio is a real deficiency, and 40KB of
PhotoSwipe for the same outcome is a poor trade against the performance budget. Full modal accessibility is
well-understood work and is specified above in enough detail to build directly.

---

## 3 · i18n URL scheme — ✅ RESOLVED

**Decision: Spanish is the default language, at the root. English is prefixed under `/en`.**

| Page | Spanish (default) | English |
|---|---|---|
| Landing | `/` | `/en` |
| About | `/sobre-mi` | `/en/about` |
| Work | `/mi-trabajo` | `/en/my-work` |

### Consequences, all already applied to this spec

- `DEFAULT_LANG = 'es'`; `LANGS` is ordered `['es', 'en']`.
- **`es.ts` is the source of truth for the dictionary type**, so a key missing from *English* is now the
  build error. Copy is authored in Spanish and translated into English — which matches how Keily will
  actually write it.
- `hreflang="x-default"` points at the Spanish URL.
- `og:locale` defaults to `es_ES`; the sitemap's `defaultLocale` is `es`.
- The 404 page renders Spanish first, and the document's root `lang` is `es`.
- The language switcher reads `ES / EN`, default first.
- **No redirect anywhere.** `/` *is* the Spanish homepage. This is the one meaningful advantage over the
  symmetric `/en` + `/es` scheme, which would have needed a redirect hop on the bare domain.

### Note on the brief

The original brief listed `/about` and `/my-work` as the page paths. Those are now the **English** URLs;
the Spanish equivalents at the root are `/sobre-mi` and `/mi-trabajo`. This follows directly from Spanish
being the default and slugs being translated, both of which are deliberate decisions — flagging it only so
the divergence from the brief's literal wording is on the record and not a surprise later.

### Deadline

Was Phase 2. Met — Phase 2 is no longer blocked.
