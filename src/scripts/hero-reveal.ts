/**
 * The hero timeline. Fires once on load rather than waiting for an observer — the hero
 * is above the fold by definition, and observing it would add a frame of delay to the
 * first thing anyone sees.
 *
 * Delays live here rather than in the markup so the sequence can be read in one place.
 * They match the table in specs/07-motion.md § Hero.
 */
const TIMELINE: Record<string, number> = {
  'line-1': 280,
  'line-2': 420,
  'line-3': 560,
  underline: 900,
  subline: 980,
  cta: 1160,
  hint: 1600,
};

function initHeroReveal(): void {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  for (const element of hero.querySelectorAll<HTMLElement>('[data-hero-step]')) {
    const step = element.dataset.heroStep ?? '';
    element.style.setProperty('--hero-delay', reduced ? '0ms' : `${TIMELINE[step] ?? 0}ms`);
  }

  // One frame, so the transition runs from the hidden state rather than skipping it.
  requestAnimationFrame(() => hero.setAttribute('data-hero-ready', ''));
}

initHeroReveal();
document.addEventListener('astro:page-load', initHeroReveal);
