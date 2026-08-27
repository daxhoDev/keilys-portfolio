/**
 * Hero parallax. Desktop only, and never registered at all under reduced motion or
 * below the md breakpoint — the cheapest listener is the one that does not exist.
 */
const BREAKPOINT = 768;
const DEFAULT_FACTOR = 0.15;

let cleanup: (() => void) | null = null;

function initParallax(): void {
  cleanup?.();

  const elements = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
  if (elements.length === 0) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = window.innerWidth < BREAKPOINT;

  // Parallax on touch scroll is janky, and mobile is where the frame budget is tightest.
  if (reduced || narrow) {
    for (const element of elements) element.style.transform = '';
    return;
  }

  let ticking = false;

  const apply = () => {
    ticking = false;
    const scrollY = window.scrollY;

    for (const element of elements) {
      // Stop doing work once the hero has left the viewport entirely.
      if (scrollY > window.innerHeight) {
        element.style.transform = '';
        continue;
      }
      const factor = Number(element.style.getPropertyValue('--parallax-factor')) || DEFAULT_FACTOR;
      element.style.transform = `translate3d(0, ${scrollY * factor}px, 0)`;
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(apply);
  };

  apply();
  window.addEventListener('scroll', onScroll, { passive: true });

  const onResize = () => initParallax();
  window.addEventListener('resize', onResize, { passive: true });

  cleanup = () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    cleanup = null;
  };
}

initParallax();
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', initParallax);
document.addEventListener('astro:page-load', initParallax);
document.addEventListener('astro:before-swap', () => cleanup?.());
