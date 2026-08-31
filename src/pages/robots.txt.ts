import type { APIRoute } from 'astro';
import { SITE } from '~/lib/site.ts';

/**
 * Generated rather than static, so it cannot disagree with the rest of the site.
 * SITE.indexable is the single switch: while it is false the whole site is closed to
 * crawlers, and flipping it opens robots.txt, drops every noindex and emits the
 * sitemap together (specs/08-accessibility-seo-performance.md).
 */
export const GET: APIRoute = () => {
  const body = SITE.indexable
    ? `User-agent: *
Allow: /

Sitemap: ${SITE.url}/sitemap-index.xml
`
    : `# The site is on a temporary vercel.app URL and is deliberately closed to crawlers.
# Flipping SITE.indexable in src/lib/site.ts opens this, removes every noindex and
# emits the sitemap — all three together.
User-agent: *
Disallow: /
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
