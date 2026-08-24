import type { es } from './es';

/**
 * The dictionary shape is derived from Spanish, because Spanish is the default
 * language and the source of truth. A key missing from *English* is therefore the
 * build error — which matches how the copy is actually produced: Keily writes in
 * Spanish, and English is translated from it.
 */
export type Dictionary = typeof es;

export type { Lang, PageKey } from './routes';
