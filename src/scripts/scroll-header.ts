/**
 * Toggles the header's scrolled state past 24px.
 *
 * One passive listener, one rAF-throttled write, and it only touches an attribute —
 * the transition itself is CSS. Idempotent and re-runs on astro:page-load, so view
 * transitions never leave a dead listener behind.
 */
const SCROLL_THRESHOLD = 24;

let ticking = false;
let cleanup: (() => void) | null = null;

function initScrollHeader(): void {
  cleanup?.();

  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;

  // Only the transparent (landing) header changes state; elsewhere it is always solid.
  if (!header.hasAttribute('data-transparent')) return;

  const apply = () => {
    ticking = false;
    header.toggleAttribute('data-scrolled', window.scrollY > SCROLL_THRESHOLD);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(apply);
  };

  apply();
  window.addEventListener('scroll', onScroll, { passive: true });

  cleanup = () => {
    window.removeEventListener('scroll', onScroll);
    cleanup = null;
  };
}

initScrollHeader();
document.addEventListener('astro:page-load', initScrollHeader);
