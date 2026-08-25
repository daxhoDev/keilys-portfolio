/**
 * Mobile menu: open/close, focus trap, focus return, scroll lock, inert background.
 *
 * Notes on the choices here, since they are the ones that get quietly broken:
 *
 * · The trap reads focusable elements on every Tab rather than caching them, because
 *   the menu's contents can change (the language switcher renders a link or a span).
 * · Scroll lock compensates for the scrollbar width, or locking shifts the page.
 * · `inert` on the siblings is what actually hides the background from a screen
 *   reader; aria-hidden alone would leave the content focusable.
 * · The panel is `hidden` when closed, so its links are never tabbable from the page.
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let teardown: (() => void) | null = null;

function initMobileMenu(): void {
  teardown?.();

  const menu = document.querySelector<HTMLElement>('[data-mobile-menu]');
  const openButton = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  const closeButton = menu?.querySelector<HTMLButtonElement>('[data-menu-close]');
  if (!menu || !openButton || !closeButton) return;

  let lastFocused: HTMLElement | null = null;

  const siblings = () =>
    [...document.body.children].filter(
      (element): element is HTMLElement => element instanceof HTMLElement && element !== menu,
    );

  const focusable = () =>
    [...menu.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (element) => element.offsetParent !== null || element === document.activeElement,
    );

  const isOpen = () => menu.hasAttribute('data-open');

  const open = (): void => {
    if (isOpen()) return;
    lastFocused = document.activeElement as HTMLElement | null;

    menu.hidden = false;
    // Force a frame so the transition runs from the off-screen position.
    void menu.offsetWidth;
    menu.setAttribute('data-open', '');
    openButton.setAttribute('aria-expanded', 'true');

    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    for (const sibling of siblings()) sibling.inert = true;

    closeButton.focus();
  };

  const close = ({ restoreFocus = true } = {}): void => {
    if (!isOpen()) return;

    menu.removeAttribute('data-open');
    openButton.setAttribute('aria-expanded', 'false');

    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    for (const sibling of siblings()) sibling.inert = false;

    if (restoreFocus) (lastFocused ?? openButton).focus();

    // Stay out of the tab order once the slide-out has finished.
    const hide = () => {
      if (!isOpen()) menu.hidden = true;
    };
    menu.addEventListener('transitionend', hide, { once: true });
    window.setTimeout(hide, 400);
  };

  const onKeydown = (event: KeyboardEvent): void => {
    if (!isOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== 'Tab') return;

    const items = focusable();
    if (items.length === 0) return;

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !menu.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onOpenClick = () => open();
  const onCloseClick = () => close();
  // A nav link inside the menu navigates; the menu must not survive the route change.
  const onMenuClick = (event: Event) => {
    if ((event.target as HTMLElement).closest('a')) close({ restoreFocus: false });
  };

  openButton.addEventListener('click', onOpenClick);
  closeButton.addEventListener('click', onCloseClick);
  menu.addEventListener('click', onMenuClick);
  document.addEventListener('keydown', onKeydown);

  teardown = () => {
    close({ restoreFocus: false });
    openButton.removeEventListener('click', onOpenClick);
    closeButton.removeEventListener('click', onCloseClick);
    menu.removeEventListener('click', onMenuClick);
    document.removeEventListener('keydown', onKeydown);
    teardown = null;
  };
}

initMobileMenu();
document.addEventListener('astro:page-load', initMobileMenu);
document.addEventListener('astro:before-swap', () => teardown?.());
