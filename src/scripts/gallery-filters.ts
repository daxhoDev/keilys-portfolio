/**
 * Tone filtering. Every photograph is already in the DOM, so filtering toggles the
 * `hidden` attribute — no re-render, no layout thrash, no fetch.
 *
 * The active filter is written to the URL with replaceState so a filtered view is
 * linkable and survives reload, without stacking history entries on every chip press.
 */
const VALID = ['all', 'bw', 'colour'] as const;
type ToneFilter = (typeof VALID)[number];

const isValid = (value: string | null): value is ToneFilter =>
  value !== null && (VALID as readonly string[]).includes(value);

let teardown: (() => void) | null = null;

function initGalleryFilters(): void {
  teardown?.();

  const group = document.querySelector<HTMLElement>('[data-gallery-filters]');
  const gallery = document.querySelector<HTMLElement>('[data-gallery]');
  const status = document.querySelector<HTMLElement>('[data-photo-count]');
  if (!gallery) return;

  const cards = [...gallery.querySelectorAll<HTMLElement>('[data-photo]')];
  // Both plural forms come from the dictionary: "1 fotografía" is not "1 fotografías".
  const countOne = status?.dataset.templateOne ?? '1';
  const countOther = status?.dataset.templateOther ?? '{n}';
  const emptyState = document.querySelector<HTMLElement>('[data-gallery-empty]');

  const apply = (filter: ToneFilter, { updateUrl = true } = {}) => {
    let visible = 0;

    for (const card of cards) {
      const matches = filter === 'all' || card.dataset.tone === filter;
      card.hidden = !matches;
      if (matches) visible += 1;
    }

    if (group) {
      for (const chip of group.querySelectorAll<HTMLButtonElement>('[data-filter]')) {
        chip.setAttribute('aria-pressed', String(chip.dataset.filter === filter));
      }
    }

    // Politely announced, so a screen-reader user hears the result of their choice.
    if (status) {
      status.textContent = visible === 1 ? countOne : countOther.replace('{n}', String(visible));
    }
    if (emptyState) emptyState.hidden = visible !== 0;

    if (updateUrl) {
      const url = new URL(window.location.href);
      if (filter === 'all') url.searchParams.delete('filter');
      else url.searchParams.set('filter', filter);
      window.history.replaceState({}, '', url);
    }
  };

  const onClick = (event: Event) => {
    const chip = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-filter]');
    if (!chip || chip.disabled) return;
    const filter = chip.dataset.filter ?? 'all';
    if (isValid(filter)) apply(filter);
  };

  // The empty state's "show all" resets the filter.
  const showAll = document.querySelector<HTMLElement>('[data-show-all]');
  const onShowAll = () => apply('all');

  group?.addEventListener('click', onClick);
  showAll?.addEventListener('click', onShowAll);

  // An unknown or hand-edited ?filter= falls back to showing everything.
  const requested = new URL(window.location.href).searchParams.get('filter');
  apply(isValid(requested) ? requested : 'all', { updateUrl: false });

  teardown = () => {
    group?.removeEventListener('click', onClick);
    showAll?.removeEventListener('click', onShowAll);
    teardown = null;
  };
}

initGalleryFilters();
document.addEventListener('astro:page-load', initGalleryFilters);

// Module scope: these files share a global namespace for type-checking otherwise,
// and two of them legitimately want a variable called `teardown`.
export {};
