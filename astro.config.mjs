// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Temporary Vercel URL. A custom domain comes much later — see specs/09-open-decisions.md §5.
  site: 'https://keilymargallery.vercel.app',
  output: 'static',
});
