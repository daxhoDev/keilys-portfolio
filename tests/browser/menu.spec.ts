/**
 * The mobile menu's accessibility contract. Every assertion here is behaviour that
 * cannot be seen in the HTML: focus movement, trapping, scroll lock, inert.
 *
 * specs/03-information-architecture.md § Mobile menu.
 */
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 812 } });

test.describe('mobile menu', () => {
  test('opens, closes, and reports its state to assistive technology', async ({ page }) => {
    await page.goto('/');
    const trigger = page.locator('[data-menu-open]');
    const menu = page.locator('[data-mobile-menu]');

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeHidden();

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toBeVisible();

    await page.locator('[data-menu-close]').click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeHidden();
  });

  test('moves focus into the menu on open', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-menu-open]').click();
    await expect(page.locator('[data-menu-close]')).toBeFocused();
  });

  test('returns focus to the trigger on close', async ({ page }) => {
    await page.goto('/');
    const trigger = page.locator('[data-menu-open]');
    await trigger.click();
    await page.locator('[data-menu-close]').click();
    await expect(trigger).toBeFocused();
  });

  test('Escape closes it and restores focus', async ({ page }) => {
    await page.goto('/');
    const trigger = page.locator('[data-menu-open]');
    await trigger.click();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-mobile-menu]')).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('traps Tab inside the menu', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-menu-open]').click();

    // Tab all the way round and assert focus never escapes the panel.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(
        () => !!document.activeElement?.closest('[data-mobile-menu]'),
      );
      expect(inside, `focus escaped after ${i + 1} tabs`).toBe(true);
    }
  });

  test('traps Shift+Tab backwards too', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-menu-open]').click();

    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Shift+Tab');
      const inside = await page.evaluate(
        () => !!document.activeElement?.closest('[data-mobile-menu]'),
      );
      expect(inside, `focus escaped backwards after ${i + 1} tabs`).toBe(true);
    }
  });

  test('makes the rest of the document inert', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-menu-open]').click();
    const headerInert = await page.evaluate(() =>
      document.querySelector('[data-header]')?.closest('body > *')?.hasAttribute('inert'),
    );
    expect(headerInert).toBe(true);
  });

  test('locks background scroll without shifting the page', async ({ page }) => {
    await page.goto('/');
    const widthBefore = await page.evaluate(() => document.documentElement.clientWidth);

    await page.locator('[data-menu-open]').click();
    const overflow = await page.evaluate(() => document.body.style.overflow);
    const widthDuring = await page.evaluate(() => document.documentElement.clientWidth);

    expect(overflow).toBe('hidden');
    expect(widthDuring).toBe(widthBefore);

    await page.keyboard.press('Escape');
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
  });

  test('closes when a nav link inside it navigates', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-menu-open]').click();
    await page.locator('[data-mobile-menu] a', { hasText: 'Mi trabajo' }).click();

    await expect(page).toHaveURL('/mi-trabajo');
    await expect(page.locator('[data-mobile-menu]')).toBeHidden();
    await expect(page.locator('[data-menu-open]')).toHaveAttribute('aria-expanded', 'false');
  });
});
