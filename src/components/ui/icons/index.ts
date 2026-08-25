/** Icon name -> component, so a data-driven list (SITE.socials) can render icons
 *  without a dynamic import or a lookup at every call site. */
export const ICON_NAMES = ['instagram', 'mail', 'arrow', 'menu', 'close'] as const;
export type IconName = (typeof ICON_NAMES)[number];
