/**
 * axe on every route, in both languages, and with the mobile menu open — the
 * automated half of the Phase 8 accessibility audit, run continuously from Phase 3
 * rather than discovered at the end.
 *
 * A pass here is not a passing accessibility audit. Keyboard order, screen-reader
 * output and 200% zoom are manual checks (specs/08-accessibility-seo-performance.md).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/', '/sobre-mi', '/mi-trabajo', '/en', '/en/about', '/en/my-work', '/404'];

for (const route of ROUTES) {
  test(`${route} has no axe violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('the open mobile menu has no axe violations', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.locator('[data-menu-open]').click();

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
