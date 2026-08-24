# 12 · Copy delivered by Keily

Everything Keily has written, **verbatim in Spanish**, mapped to the translation key it fills. This is the
source of truth for `es.ts`. Answers were collected in
[preguntas-para-keily.md](./preguntas-para-keily.md).

**All of it arrived in Spanish only.** English is translated on the build side and **ships without her
review** ([decision 5.3](./09-open-decisions.md#5--delivery--launch-decisions)), so it neither waits on her
nor blocks launch. It is translated as prose rather than literally: her biography has a voice, and since
nobody downstream will catch a wrong register, it gets a deliberate second pass before launch.

**Two of her strings were edited**, each by the smallest possible amount — one verb, two punctuation marks.
Both are marked below and both are disclosed to her. Everything else on this page is verbatim.

---

## Hero (`t.hero`)

| Key | Value |
|---|---|
| `headline` | `['Hola, soy Keily,', 'y soy', 'fotógrafa.']` — she approved the proposed sentence as-is |
| `subline` | *"Artista autodidacta. **Exploro** el medio cotidiano en busca de sentido artístico, especialmente mediante las bondades del blanco y negro."* — one word changed, see below |

**The accent word.** She asked for the highlight on *fotógrafa* to be "gris o plateado" instead of gold.
It renders in `mustang-soft` (`#B4B2AF`) with a 1px `mustang` underline. Plain `mustang` was rejected for
this one use: at 5.1 : 1 against the rest of the headline's `bone`, the emphasised word would read as
*dimmer* than the words around it — the opposite of emphasis. The silver step plus the rule keeps it
distinct without pushing it backwards. See [02-design-system.md](./02-design-system.md#colour).

**`subline` — one word changed** ([decision 5.8](./09-open-decisions.md#5--delivery--launch-decisions)).
She wrote *"Explora el medio cotidiano"*, third person, directly beneath a first-person headline. A fuller
rewrite was considered and **rejected** in favour of the smallest correction that fixes it:
**`Explora` → `Exploro`.** Nothing else is touched — not the length, not the vocabulary, not the rhythm.

It stays ~20 words against a ≤15-word guide, so it wraps to three lines at 375px under a `display-xl`
headline. That is a hero-layout constraint, not a reason to edit her sentence: the subline container has no
fixed height and the hero is `min-height: 100svh`, so three lines fit.

She is told about the change in [pendientes-para-keily.md](./pendientes-para-keily.md); reverting is one
string.

## About, landing section (`t.about`)

`lead` + `body[]`, split from her ~130-word introduction. Verbatim, split only at sentence boundaries:

> **lead** — Soy Keily Mar, fotógrafa autodidacta con una vocación que nació en la infancia y se consolidó
> en la adolescencia, cuando decidí explorar a fondo la técnica y el lenguaje artístico de la imagen.
>
> **body[0]** — Mi mirada se detiene en lo que suele pasar desapercibido: calles urbanas con sus secretos
> mejor guardados, pueblos de mar, rincones que cuentan historias silenciosas, animales como las palomas, y
> personas envueltas en su cotidianidad. Creo firmemente que cada instante tiene un peso visual y espiritual
> que merece ser eternizado.
>
> **body[1]** — Por eso, en mis fotografías busco despojar la realidad del ruido cromático y revelar su
> esencia a través del blanco y negro. Así, cada captura se convierte en un encuentro honesto entre lo que
> veo y lo que siento. Bienvenido a mi mundo.

`eyebrow`, `heading` and `cta` are still ours to write — she supplied prose, not labels. Proposals, pending
her review: eyebrow *"Sobre mí"*, heading *"Detrás de la cámara"*, cta *"Leer más"*.

## About, full page (`t.about.page`)

`page.body[]` is her long text, ~560 words, split into 8 paragraphs at her own sentence boundaries. The full
text is reproduced verbatim in [preguntas-para-keily.md](./preguntas-para-keily.md) §10 and is not duplicated
here; the split is:

| Paragraph | Starts | Subject |
|---|---|---|
| 1 | *"Mi vínculo con la fotografía nació en la infancia…"* | Her father, learning to look |
| 2 | *"En la adolescencia algo cambió en mi interior…"* | Deciding to go further |
| 3 | *"Acudí a libros y a internet…"* | Teaching herself |
| 4 | *"En ese proceso de evolución…"* | Finding black and white |
| 5 | *"Sin embargo, no sería justo reducir mi trabajo…"* | Her colour work, cold tones |
| 6 | *"No me gusta poner límites…"* | How she takes on projects |
| 7 | *"Paradójicamente, en mi infancia soñaba con ser actriz…"* | Theatre, and moving behind the camera |
| 8 | *"Cada persona, cada animal, las olas del mar…"* | Closing |

`page.title` and `page.lead` are not yet written. Proposal, pending review: title *"Sobre mí"*, lead = the
first sentence of paragraph 1.

Paragraph 5 is worth noting for the gallery: her colour work is described as a deliberate register, not an
exception. That is the justification for the tone filter in
[09-open-decisions.md](./09-open-decisions.md#1--gallery-organisation-resolved-d-tone), and it means the
*Color* chip must not be empty at launch.

## Facts list (`t.about.page.facts[]`)

She left the answer blank, which reads as accepting the proposed table. Treated as **provisional — confirm
before launch**:

| Label (ES) | Value |
|---|---|
| Con base en | Holguín |
| Trabajando desde | 2020 |
| Fotografío | Calle, mar, animales, eventos culturales, personas |
| Idiomas | Español e Inglés |
| Equipo | Canon PowerShot SX400 IS |

## Section micro-copy

| Key | Value |
|---|---|
| `t.work.lead` (above the gallery) | *"Instantáneas de encuentros honestos, entre lo que veo y lo que siento."* |
| `t.contact.lead` (above the form) | *"¿Deseas contar una historia junto a mí? Estoy a un mensaje de distancia."* |
| `t.footer.tagline` (under her name) | *"Las fotografías: epitafios de lo que vivo."* — punctuation corrected, see below |

**`footer.tagline` — punctuation corrected** ([decision 5.8](./09-open-decisions.md#5--delivery--launch-decisions)).
She wrote *"Las fotografías; epitafios de lo que vivo"* — semicolon, no final stop. A semicolon joining a
noun phrase to its own gloss is not what Spanish punctuation calls for, and set in small italic Playfair
under her name it reads as a slip rather than a choice. It ships as:

> *"Las fotografías: epitafios de lo que vivo."*

Her words, unchanged; two marks. She is told in [pendientes-para-keily.md](./pendientes-para-keily.md), and
if the semicolon was deliberate it goes back in one string.

## Identity and contact (`SITE`)

| Field | Value |
|---|---|
| Name | **Keily Mar Couselo** — she is moving to the full name |
| Email | `kylieemar0500@gmail.com` — shown as a plain, visible `mailto:` |
| Instagram (work) | [`@kyliemargallery`](https://instagram.com/kyliemargallery) — listed first |
| Instagram (personal) | [`@_kyliemar_`](https://instagram.com/_kyliemar_) |
| Other socials | None |
| URL | `https://keilymargallery.vercel.app`, `noindex` for now; custom domain much later |

**How the name is used.** "Keily Mar Couselo" is long for a header wordmark at 375px, and the hero already
introduces her as "Keily". So:

| Where | Text |
|---|---|
| Header wordmark | *Keily Mar* |
| Hero headline | *Hola, soy Keily, y soy fotógrafa.* (unchanged — it is her voice, not a label) |
| `<title>`, `og:site_name`, JSON-LD `name`, footer, copyright | *Keily Mar Couselo* |

This is a judgement call, not something she specified. If she wants the full name in the header too, it is
one string.

**Two Instagram accounts.** Both are listed. The work account (`kyliemargallery`) comes first and gets the
prominent treatment; the personal one is second. Each needs its own label so a screen reader does not
announce "Instagram" twice — `t.contact.socials.instagramGallery` / `.instagramPersonal`.

## Favicon

A **"K" in black on a light ground** — her words, and deliberately inverted from the site. Specified in
[02-design-system.md](./02-design-system.md#brand-mark--favicon).

## Later phases she asked for

Marked in §Parte 5. None of these is in scope now; recorded so the architecture leaves room:

- **Servicios y precios** — will need a fourth nav entry. `ROUTES` and `Nav` already iterate, so this is
  additive.
- **Blog / diario** — a second content collection and an index route.
- **Venta de copias** — the only one that is not a small addition; it needs a payment provider and turns the
  site into something with a backend.

Not asked for: testimonials, booking.

## Still missing

Tracked in full in [10-content-checklist.md](./10-content-checklist.md). After the delivery decisions in
[09-open-decisions.md §5](./09-open-decisions.md#5--delivery--launch-decisions), the list is short and it is
almost entirely one thing: **the 20 photographs and everything attached to them** — one line of alt text
each, `bw` or `colour` for each, and her six favourites for the landing page.

Nothing else is waiting on Keily. The facts list ships as proposed, English is handled, the interface strings
are ours to write, and the site has a URL.
