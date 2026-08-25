/**
 * The lightbox controller.
 *
 * Contract in specs/09-open-decisions.md § Build spec for the Lightbox — every point
 * there is an acceptance criterion, and the ones most easily broken are:
 *
 *  · it walks the VISIBLE cards, so with a tone filter active both navigation and the
 *    counter operate on the filtered set without any reconciliation;
 *  · focus returns to the thumbnail that opened it, not to the top of the page;
 *  · the page behind is inert AND scroll-locked with scrollbar compensation;
 *  · it pushes no history, so Esc and browser-back stay predictable.
 */
const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
const SWIPE_THRESHOLD = 50;

let teardown: (() => void) | null = null;

function initLightbox(): void {
  teardown?.();

  const dialog = document.querySelector<HTMLElement>('[data-lightbox]');
  const gallery = document.querySelector<HTMLElement>('[data-gallery]');
  if (!dialog || !gallery) return;

  const image = dialog.querySelector<HTMLImageElement>('[data-lightbox-image]');
  const titleEl = dialog.querySelector<HTMLElement>('[data-lightbox-title]');
  const captionEl = dialog.querySelector<HTMLElement>('[data-lightbox-caption]');
  const counterEl = dialog.querySelector<HTMLElement>('[data-lightbox-counter]');
  const liveEl = dialog.querySelector<HTMLElement>('[data-lightbox-live]');
  const closeButton = dialog.querySelector<HTMLButtonElement>('[data-lightbox-close]');
  if (!image || !counterEl || !closeButton) return;

  const counterTemplate = counterEl.dataset.template ?? '{i} / {n}';

  let index = 0;
  let openedFrom: HTMLElement | null = null;

  /** Visible cards only — this is what makes filtering and the lightbox agree. */
  const cards = () =>
    [...gallery.querySelectorAll<HTMLElement>('[data-photo]')].filter((card) => !card.hidden);

  const isOpen = () => dialog.hasAttribute('data-open');

  const siblings = () =>
    [...document.body.children].filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== dialog,
    );

  const show = (next: number) => {
    const list = cards();
    if (list.length === 0) return;

    index = (next + list.length) % list.length;
    const card = list[index];
    const source = card.querySelector('img');
    if (!source) return;

    // Reuse the gallery's own srcset: the no-upscale clamp comes with it.
    image.removeAttribute('data-shown');
    image.src = source.currentSrc || source.src;
    image.srcset = source.srcset;
    image.sizes = '90vw';
    image.alt = source.alt;
    requestAnimationFrame(() => image.setAttribute('data-shown', ''));

    const title = card.dataset.title ?? '';
    const caption = card.dataset.caption ?? '';
    if (titleEl) {
      titleEl.textContent = title;
      titleEl.hidden = !title;
    }
    if (captionEl) {
      captionEl.textContent = caption;
      captionEl.hidden = !caption;
    }

    const counter = counterTemplate
      .replace('{i}', String(index + 1))
      .replace('{n}', String(list.length));
    counterEl.textContent = counter;
    if (liveEl) liveEl.textContent = title ? `${counter} — ${title}` : counter;

    preload(list, index);
  };

  /** Prefetch the neighbours so navigation does not flash. */
  const preload = (list: HTMLElement[], current: number) => {
    for (const offset of [1, -1]) {
      const neighbour = list[(current + offset + list.length) % list.length];
      const img = neighbour?.querySelector('img');
      if (!img) continue;
      const preloader = new Image();
      preloader.srcset = img.srcset;
      preloader.src = img.currentSrc || img.src;
    }
  };

  const open = (from: HTMLElement, at: number) => {
    if (isOpen()) return;
    openedFrom = from;

    dialog.hidden = false;
    void dialog.offsetWidth;
    dialog.setAttribute('data-open', '');

    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    for (const sibling of siblings()) sibling.inert = true;

    show(at);
    closeButton.focus();
  };

  const close = ({ restoreFocus = true } = {}) => {
    if (!isOpen()) return;

    dialog.removeAttribute('data-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    for (const sibling of siblings()) sibling.inert = false;

    if (restoreFocus) openedFrom?.focus();
    openedFrom = null;

    const hide = () => {
      if (!isOpen()) dialog.hidden = true;
    };
    dialog.addEventListener('transitionend', hide, { once: true });
    window.setTimeout(hide, 400);
  };

  const onGalleryClick = (event: Event) => {
    const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-lightbox-open]');
    if (!trigger) return;
    const card = trigger.closest<HTMLElement>('[data-photo]');
    if (!card) return;
    const at = cards().indexOf(card);
    if (at >= 0) open(trigger, at);
  };

  const onDialogClick = (event: Event) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-lightbox-close]')) close();
    else if (target.closest('[data-lightbox-prev]')) show(index - 1);
    else if (target.closest('[data-lightbox-next]')) show(index + 1);
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (!isOpen()) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        close();
        return;
      case 'ArrowLeft':
        event.preventDefault();
        show(index - 1);
        return;
      case 'ArrowRight':
        event.preventDefault();
        show(index + 1);
        return;
      case 'Tab':
        break;
      default:
        return;
    }

    const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null,
    );
    if (items.length === 0) return;

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !dialog.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  // Pointer events rather than a gesture library: horizontal swipes navigate,
  // a downward swipe closes.
  let startX = 0;
  let startY = 0;
  let tracking = false;

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') return;
    tracking = true;
    startX = event.clientX;
    startY = event.clientY;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!tracking) return;
    tracking = false;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      show(dx < 0 ? index + 1 : index - 1);
    } else if (dy > SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      close();
    }
  };

  gallery.addEventListener('click', onGalleryClick);
  dialog.addEventListener('click', onDialogClick);
  document.addEventListener('keydown', onKeydown);
  dialog.addEventListener('pointerdown', onPointerDown);
  dialog.addEventListener('pointerup', onPointerUp);

  teardown = () => {
    close({ restoreFocus: false });
    gallery.removeEventListener('click', onGalleryClick);
    dialog.removeEventListener('click', onDialogClick);
    document.removeEventListener('keydown', onKeydown);
    dialog.removeEventListener('pointerdown', onPointerDown);
    dialog.removeEventListener('pointerup', onPointerUp);
    teardown = null;
  };
}

initLightbox();
document.addEventListener('astro:page-load', initLightbox);
document.addEventListener('astro:before-swap', () => teardown?.());

export {};
