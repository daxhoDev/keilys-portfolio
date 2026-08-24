import type { Lang } from './routes';
import type { Dictionary } from './types';
import { es } from './es';
import { en } from './en';

const DICTIONARIES: Record<Lang, Dictionary> = { es, en };

/** The dictionary for a language. Components call this once and read `t.*` from it. */
export function useTranslations(lang: Lang): Dictionary {
  return DICTIONARIES[lang];
}

/** BCP 47 tag for <html lang> and hreflang. */
export const HTML_LANG: Record<Lang, string> = { es: 'es', en: 'en' };

/** Open Graph locale. */
export const OG_LOCALE: Record<Lang, string> = { es: 'es_ES', en: 'en_US' };
