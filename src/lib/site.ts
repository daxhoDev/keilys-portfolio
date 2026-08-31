/**
 * Site-wide constants. Values confirmed by Keily — see specs/12-copy-from-keily.md.
 */
export const SITE = {
  /** Full name. Used in <title>, og:site_name, JSON-LD, footer and copyright. */
  name: 'Keily Mar Couselo',

  /** The header logotype. Shortened because three words at display-sm crowd the nav at 375px. */
  wordmark: 'Keily Mar',

  /** Temporary Vercel URL. A custom domain comes much later; this is the only line that changes. */
  url: 'https://keilymargallery-sage.vercel.app',

  /**
   * false while the site lives on *.vercel.app: noindex on every page, Disallow in
   * robots.txt, no sitemap. Flipping this to true is a launch step for the real
   * domain, not a code change. See specs/08-accessibility-seo-performance.md.
   */
  indexable: false,

  email: 'kylieemar0500@gmail.com',

  /**
   * Rendered by a single loop in both the contact section and the footer.
   * The two Instagram entries share an icon, so their ids differ deliberately —
   * that forces two distinct translation keys and stops a screen reader
   * announcing the same link twice. Work account first.
   */
  socials: [
    { id: 'instagramGallery', href: 'https://instagram.com/kyliemargallery', icon: 'instagram' },
    { id: 'instagramPersonal', href: 'https://instagram.com/_kyliemar_', icon: 'instagram' },
    { id: 'email', href: 'mailto:kylieemar0500@gmail.com', icon: 'mail' },
  ],
} as const;

export type SocialId = (typeof SITE.socials)[number]['id'];

/** Absolute URL for a path, built from SITE.url. Canonical, og:url and hreflang all use this. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).href;
}
