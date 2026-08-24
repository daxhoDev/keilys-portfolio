/**
 * The single source of truth for URLs. Nothing anywhere else builds a path by
 * string concatenation — adding a third language later is a change to ROUTES
 * plus new page files, never a change to a component.
 *
 * See specs/03-information-architecture.md § Route table.
 */

/** Default language first. Spanish is the default and lives at the root. */
export const LANGS = ['es', 'en'] as const;

export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = 'es';

export type PageKey = 'home' | 'about' | 'work';

export const ROUTES: Record<PageKey, Record<Lang, string>> = {
  home: { es: '/', en: '/en' },
  about: { es: '/sobre-mi', en: '/en/about' },
  work: { es: '/mi-trabajo', en: '/en/my-work' },
};

/** Path for a page in a language. */
export function path(page: PageKey, lang: Lang): string {
  return ROUTES[page][lang];
}

/**
 * Which language a URL belongs to. English if and only if the first path segment
 * is `en` — a one-line rule precisely because Spanish is the unprefixed default.
 */
export function getLangFromUrl(url: URL): Lang {
  return url.pathname.split('/')[1] === 'en' ? 'en' : 'es';
}

/** Normalised pathname: no trailing slash, except for the root itself. */
function normalise(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/** Which PageKey a URL is, or null when it is not a mapped page (i.e. the 404). */
export function getPageKey(url: URL): PageKey | null {
  const current = normalise(url.pathname);
  for (const key of Object.keys(ROUTES) as PageKey[]) {
    if (Object.values(ROUTES[key]).some((route) => route === current)) return key;
  }
  return null;
}

/**
 * The equivalent URL of the current page in the given language — powers the switcher.
 * Guarantees landing on the *equivalent page*, never on the homepage, except from a
 * URL that has no PageKey at all (the 404), where the homepage is the only sane answer.
 */
export function alternatePath(url: URL, lang: Lang): string {
  const key = getPageKey(url);
  return key ? path(key, lang) : path('home', lang);
}

/** The other language. There are two, and the switcher only ever needs the opposite one. */
export function otherLang(lang: Lang): Lang {
  return lang === 'es' ? 'en' : 'es';
}
