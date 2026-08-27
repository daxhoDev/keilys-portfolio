/**
 * One IntersectionObserver for every reveal on the page.
 *
 * Elements are unobserved once they fire, so a reveal happens once and never again on
 * scroll-back. Under reduced motion nothing is observed at all: everything is marked
 * revealed immediately, which is both correct and cheaper.
 */
const REVEAL_SELECTOR = '[data-reveal]';

/**
 * Where a reveal fires, expressed as how much of the viewport bottom does NOT count.
 *
 * At -8% an element triggered almost as soon as it appeared, so with a 1s entrance the
 * animation was mostly over by the time it reached comfortable reading height — the
 * motion existed but nobody saw it. At -25% the element has to climb a quarter of the
 * way up the screen first, which is the point at which someone is actually looking.
 *
 * The threshold is low on purpose: with a large bottom inset, requiring much of the
 * element to be visible as well would delay tall blocks twice over.
 */
const ROOT_MARGIN = '0px 0px -25% 0px';
const THRESHOLD = 0.1;
const STAGGER_MS = 120;
const STAGGER_CAP = 4; // min(index, 4) — a long list must not grow a two-second tail
const GALLERY_STAGGER_MS = 90;
const GALLERY_STAGGER_CAP = 7;

let observer: IntersectionObserver | null = null;
let motionQuery: MediaQueryList | null = null;
let onMotionChange: (() => void) | null = null;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function revealNow(element: Element): void {
  element.setAttribute('data-revealed', '');
}

/**
 * Stagger is computed from the element's position among its siblings, not from a prop,
 * so a section can gain or lose children without anyone maintaining delay numbers.
 */
function applyStagger(element: HTMLElement): void {
  if (element.style.getPropertyValue('--reveal-delay')) return; // explicit delay wins

  const siblings = [...(element.parentElement?.children ?? [])].filter((child) =>
    child.hasAttribute('data-reveal'),
  );
  const index = siblings.indexOf(element);
  if (index < 1) return;

  const gallery = element.getAttribute('data-reveal') === 'gallery';
  const step = gallery ? GALLERY_STAGGER_MS : STAGGER_MS;
  const cap = gallery ? GALLERY_STAGGER_CAP : STAGGER_CAP;

  element.style.setProperty('--reveal-delay', `${Math.min(index, cap) * step}ms`);
}

function initReveal(): void {
  observer?.disconnect();
  observer = null;

  const elements = [...document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)];
  if (elements.length === 0) return;

  if (prefersReducedMotion()) {
    elements.forEach(revealNow);
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        revealNow(entry.target);
        observer?.unobserve(entry.target);
      }
    },
    { threshold: THRESHOLD, rootMargin: ROOT_MARGIN },
  );

  for (const element of elements) {
    applyStagger(element);
    observer.observe(element);
  }
}

/** A person toggling the OS setting mid-session gets the right behaviour without a reload. */
function watchMotionPreference(): void {
  if (motionQuery && onMotionChange) motionQuery.removeEventListener('change', onMotionChange);

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  onMotionChange = () => initReveal();
  motionQuery.addEventListener('change', onMotionChange);
}

initReveal();
watchMotionPreference();
document.addEventListener('astro:page-load', initReveal);
document.addEventListener('astro:before-swap', () => observer?.disconnect());
