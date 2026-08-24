// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import { SITE } from './src/lib/site.ts';

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  output: 'static',
  trailingSlash: 'never',
  vite: { plugins: [tailwindcss()] },
  // The sitemap is emitted only once the site is indexable, i.e. once it has a real
  // domain. See specs/08-accessibility-seo-performance.md § Indexing is off until…
  integrations: [
    ...(SITE.indexable
      ? [sitemap({ i18n: { defaultLocale: 'es', locales: { es: 'es-ES', en: 'en-US' } } })]
      : []),
  ],
  image: { service: { entrypoint: 'astro/assets/services/sharp' } },
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
});
