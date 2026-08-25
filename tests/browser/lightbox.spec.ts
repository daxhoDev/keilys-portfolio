/**
 * The lightbox's accessibility contract — specs/09-open-decisions.md § Build spec.
 *
 * Every assertion here is behaviour no static check can reach: where focus goes, what
 * a keyboard does, whether the page behind is really inert, whether the live region
 * fires. This is the file that would have caught a broken focus trap.
 */
import { test, expect } from '@playwright/test';

const open = async (page: import('@playwright/test').Page, index = 0) => {
  await page.goto('/mi-trabajo');
  await page.locator('[data-lightbox-open]').nth(index).click();
  await expect(page.locator('[data-lightbox]')).toBeVisible();
};

test.describe('opening and closing', () => {
  test('a photograph opens the dialog and moves focus to close', async ({ page }) => {
    await open(page);
    await expect(page.locator('[data-lightbox-close]')).toBeFocused();
  });

  test('Escape closes it and returns focus to the photograph that opened it', async ({ page }) => {
    await page.goto('/mi-trabajo');
    const trigger = page.locator('[data-lightbox-open]').nth(2);
    await trigger.click();
    await page.keyboard.press('Escape');

    await expect(page.locator('[data-lightbox]')).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('the close button closes it', async ({ page }) => {
    await open(page);
    await page.locator('[data-lightbox-close]').click();
    await expect(page.locator('[data-lightbox]')).toBeHidden();
  });

  test('it pushes no history — back leaves the page rather than closing the dialog', async ({
    page,
  }) => {
    await page.goto('/');
    await page.goto('/mi-trabajo');
    await page.locator('[data-lightbox-open]').first().click();
    await page.goBack();
    await expect(page).toHaveURL('/');
  });
});

test.describe('keyboard', () => {
  test('arrows navigate and the counter follows', async ({ page }) => {
    await open(page);
    const counter = page.locator('[data-lightbox-counter]');
    await expect(counter).toHaveText('1 de 27');

    await page.keyboard.press('ArrowRight');
    await expect(counter).toHaveText('2 de 27');

    await page.keyboard.press('ArrowLeft');
    await expect(counter).toHaveText('1 de 27');
  });

  test('it wraps around at both ends', async ({ page }) => {
    await open(page);
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('[data-lightbox-counter]')).toHaveText('27 de 27');

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-lightbox-counter]')).toHaveText('1 de 27');
  });

  test('Tab is trapped inside the dialog', async ({ page }) => {
    await open(page);
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(
        () => !!document.activeElement?.closest('[data-lightbox]'),
      );
      expect(inside, `focus escaped after ${i + 1} tabs`).toBe(true);
    }
  });

  test('Shift+Tab is trapped too', async ({ page }) => {
    await open(page);
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Shift+Tab');
      const inside = await page.evaluate(
        () => !!document.activeElement?.closest('[data-lightbox]'),
      );
      expect(inside, `focus escaped backwards after ${i + 1} tabs`).toBe(true);
    }
  });
});

test.describe('the page behind', () => {
  test('is inert and scroll-locked without shifting', async ({ page }) => {
    await page.goto('/mi-trabajo');
    const widthBefore = await page.evaluate(() => document.documentElement.clientWidth);

    await page.locator('[data-lightbox-open]').first().click();

    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    expect(await page.evaluate(() => document.documentElement.clientWidth)).toBe(widthBefore);
    expect(await page.evaluate(() => document.querySelector('main')?.hasAttribute('inert'))).toBe(
      true,
    );
  });

  test('is restored on close', async ({ page }) => {
    await open(page);
    await page.keyboard.press('Escape');
    await expect
      .poll(() => page.evaluate(() => document.querySelector('main')?.hasAttribute('inert')))
      .toBe(false);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });
});

test.describe('announcements', () => {
  test('the live region reports the counter on navigation', async ({ page }) => {
    await open(page);
    const live = page.locator('[data-lightbox-live]');
    await expect(live).toContainText('1 de 27');

    await page.keyboard.press('ArrowRight');
    await expect(live).toContainText('2 de 27');
  });
});

test.describe('filtering and the lightbox agree', () => {
  test('navigation stays inside the filtered set', async ({ page }) => {
    await page.goto('/mi-trabajo');
    await page.locator('[data-filter="colour"]').click();

    const visible = await page.locator('[data-photo]:not([hidden])').count();
    expect(visible).toBe(10);

    await page.locator('[data-photo]:not([hidden]) [data-lightbox-open]').first().click();
    await expect(page.locator('[data-lightbox-counter]')).toHaveText(`1 de ${visible}`);

    // Walk the whole filtered set and confirm it wraps at its own end, not the full 27.
    for (let i = 0; i < visible; i++) await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-lightbox-counter]')).toHaveText(`1 de ${visible}`);
  });
});

test.describe('tone filters', () => {
  test('filtering hides non-matching photographs and syncs the URL', async ({ page }) => {
    await page.goto('/mi-trabajo');
    await page.locator('[data-filter="bw"]').click();

    await expect(page).toHaveURL(/\?filter=bw$/);
    await expect(page.locator('[data-photo]:not([hidden])')).toHaveCount(17);
    await expect(page.locator('[data-filter="bw"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('"all" clears the parameter rather than writing filter=all', async ({ page }) => {
    await page.goto('/mi-trabajo?filter=bw');
    await page.locator('[data-filter="all"]').click();
    await expect(page).not.toHaveURL(/filter=/);
    await expect(page.locator('[data-photo]:not([hidden])')).toHaveCount(27);
  });

  test('a filtered URL survives a reload', async ({ page }) => {
    await page.goto('/mi-trabajo?filter=colour');
    await expect(page.locator('[data-photo]:not([hidden])')).toHaveCount(10);
    await expect(page.locator('[data-filter="colour"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('an unknown filter falls back to showing everything', async ({ page }) => {
    await page.goto('/mi-trabajo?filter=sepia');
    await expect(page.locator('[data-photo]:not([hidden])')).toHaveCount(27);
    await expect(page.locator('[data-filter="all"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('the count is announced and pluralised correctly', async ({ page }) => {
    await page.goto('/mi-trabajo');
    const count = page.locator('[data-photo-count]');
    await expect(count).toHaveAttribute('aria-live', 'polite');
    await expect(count).toHaveText('27 fotografías');
  });
});
