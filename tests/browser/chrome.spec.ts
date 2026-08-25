/**
 * The chrome: header, nav, language switcher, footer.
 *
 * These are the checks that cannot be made against built HTML — current-page state
 * after client-side navigation, the header's scroll state, and whether a link
 * actually lands where the route table says it should.
 */
import { test, expect } from '@playwright/test';

test.describe('header', () => {
  test('is transparent over the hero and takes a background once scrolled', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('[data-header]');

    await expect(header).toHaveAttribute('data-transparent', '');
    await expect(header).not.toHaveAttribute('data-scrolled', '');

    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(header).toHaveAttribute('data-scrolled', '');

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(header).not.toHaveAttribute('data-scrolled', '');
  });

  test('starts solid on pages that have no hero', async ({ page }) => {
    await page.goto('/sobre-mi');
    await expect(page.locator('[data-header]')).not.toHaveAttribute('data-transparent', '');
  });

  test('the wordmark is the short form and links home', async ({ page }) => {
    await page.goto('/sobre-mi');
    const wordmark = page.locator('[data-header] a').first();
    await expect(wordmark).toHaveText('Keily Mar');
    await expect(wordmark).toHaveAttribute('href', '/');
  });
});

test.describe('navigation', () => {
  test('marks the current page and only the current page', async ({ page }) => {
    await page.goto('/sobre-mi');
    const current = page.locator('[data-header] a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText('Sobre mí');
  });

  test('contact is an in-page anchor on the landing page', async ({ page }) => {
    await page.goto('/');
    const contact = page.locator('[data-header] a', { hasText: 'Contacto' });
    await expect(contact).toHaveAttribute('href', '#contact');
  });

  test('contact returns to the homepage anchor from an inner page', async ({ page }) => {
    await page.goto('/mi-trabajo');
    const contact = page.locator('[data-header] a', { hasText: 'Contacto' });
    await expect(contact).toHaveAttribute('href', '/#contact');
  });

  test('aria-current follows a client-side navigation', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-header] a', { hasText: 'Mi trabajo' }).click();
    await expect(page).toHaveURL('/mi-trabajo');
    await expect(page.locator('[data-header] a[aria-current="page"]')).toHaveText('Mi trabajo');
  });
});

test.describe('language switcher', () => {
  test('lands on the equivalent page, not the homepage', async ({ page }) => {
    await page.goto('/sobre-mi');
    await page.locator('[data-header] [role="group"] a').click();
    await expect(page).toHaveURL('/en/about');

    await page.locator('[data-header] [role="group"] a').click();
    await expect(page).toHaveURL('/sobre-mi');
  });

  test('the active language is not a link', async ({ page }) => {
    await page.goto('/');
    const group = page.locator('[data-header] [role="group"]');
    await expect(group.locator('[aria-current="true"]')).toHaveText('ES');
    await expect(group.locator('a')).toHaveCount(1);
    await expect(group.locator('a')).toHaveText('EN');
  });

  test('carries lang and hreflang so the target language is announced', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('[data-header] [role="group"] a');
    await expect(link).toHaveAttribute('hreflang', 'en');
    await expect(link).toHaveAttribute('lang', 'en');
  });
});

test.describe('footer', () => {
  test('lists both Instagram accounts with distinct labels, work first', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('footer a[href*="instagram.com"]');
    await expect(links).toHaveCount(2);
    await expect(links.nth(0)).toHaveAttribute('href', 'https://instagram.com/kyliemargallery');
    await expect(links.nth(1)).toHaveAttribute('href', 'https://instagram.com/_kyliemar_');

    const first = await links.nth(0).innerText();
    const second = await links.nth(1).innerText();
    expect(first).not.toBe(second);
  });

  test('shows the email as a plain mailto — the only working contact path in v1', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('footer a[href^="mailto:"]')).toHaveAttribute(
      'href',
      'mailto:kylieemar0500@gmail.com',
    );
  });

  test('the copyright year is the build year, not a hard-coded one', async ({ page }) => {
    await page.goto('/');
    const year = new Date().getFullYear().toString();
    await expect(page.locator('footer').getByText(year)).toBeVisible();
  });
});

test.describe('skip link', () => {
  test('is the first thing a keyboard reaches and moves focus to main', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    const skip = page.locator('a[href="#main"]');
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });
});
