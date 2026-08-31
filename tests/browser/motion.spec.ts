/**
 * Motion behaviour: that reveals actually fire, fire once, and are genuinely absent
 * under reduced motion. None of this is visible in the markup.
 */
import { test, expect } from '@playwright/test';

test.describe('reveals', () => {
  test('content below the fold starts hidden and appears on scroll', async ({ page }) => {
    await page.goto('/sobre-mi');

    const target = page.locator('[data-reveal]').last();
    await expect(target).not.toHaveAttribute('data-revealed');

    await target.scrollIntoViewIfNeeded();
    await expect(target).toHaveAttribute('data-revealed', { timeout: 3000 });
  });

  test('a reveal does not replay when scrolled back to', async ({ page }) => {
    await page.goto('/sobre-mi');

    const target = page.locator('[data-reveal]').nth(2);
    // Centre it: the observer ignores the bottom 25% of the viewport on purpose, and
    // scrollIntoViewIfNeeded stops as soon as the element is technically visible.
    await target.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await expect(target).toHaveAttribute('data-revealed');

    await page.evaluate(() => window.scrollTo(0, 0));
    await target.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await expect(target).toHaveAttribute('data-revealed');
  });

  test('it fires after the element has climbed into view, not as it appears', async ({ page }) => {
    await page.goto('/sobre-mi');
    await page.evaluate(() => window.scrollTo(0, 0));

    // Put a target exactly at the bottom edge of the viewport: it must still be hidden.
    const handle = page.locator('[data-reveal]').last();
    await page.evaluate((selector) => {
      const element = [...document.querySelectorAll(selector)].pop()!;
      const top = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top - window.innerHeight + 8);
    }, '[data-reveal]');

    await page.waitForTimeout(300);
    await expect(handle).not.toHaveAttribute('data-revealed');
  });
});

test.describe('the hero timeline', () => {
  test('runs on load without waiting for a scroll', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-hero]')).toHaveAttribute('data-hero-ready', '', {
      timeout: 3000,
    });
  });

  test('the lines start masked and end in place', async ({ page }) => {
    await page.goto('/');
    const line = page.locator('[data-hero-line]').first();

    // Once the sequence is done, no residual transform is left behind.
    await expect(line).toHaveAttribute('data-hero-step', 'line-1');
    await page.waitForTimeout(2200);
    const transform = await line.evaluate((el) => getComputedStyle(el).transform);
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform);
  });

  test('descenders are not clipped by the line mask', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2200);

    // "fotógrafa." has both an accent above and a descender below.
    const accent = page.locator('[data-hero-step="line-3"]');
    const box = (await accent.boundingBox())!;
    const maskBox = (await accent.locator('xpath=..').boundingBox())!;

    expect(box.y + box.height).toBeLessThanOrEqual(maskBox.y + maskBox.height + 1);
  });
});

test.describe('reduced motion', () => {
  // contextOptions rather than the top-level shortcut: the shortcut is not in this
  // version's test options type, and a spec that does not typecheck never runs.
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('every page renders fully visible, with nothing waiting on a scroll', async ({ page }) => {
    for (const route of ['/', '/sobre-mi', '/mi-trabajo']) {
      await page.goto(route);

      const hidden = await page.evaluate(
        () =>
          [...document.querySelectorAll('[data-reveal]')].filter(
            (el) => Number(getComputedStyle(el).opacity) < 1,
          ).length,
      );
      expect(hidden, `${route} hides content under reduced motion`).toBe(0);
    }
  });

  test('the parallax listener is never registered', async ({ page }) => {
    await page.goto('/');
    const before = await page
      .locator('[data-parallax]')
      .evaluate((el) => getComputedStyle(el).transform);

    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(200);

    const after = await page
      .locator('[data-parallax]')
      .evaluate((el) => getComputedStyle(el).transform);
    expect(after).toBe(before);
  });

  test('the hero is visible immediately, without its sequence', async ({ page }) => {
    await page.goto('/');
    const opacity = await page
      .locator('[data-hero-step="subline"]')
      .evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBe(1);
  });
});

test.describe('parallax', () => {
  test('moves the hero image on desktop scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const image = page.locator('[data-parallax]');
    const before = await image.evaluate((el) => getComputedStyle(el).transform);

    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(200);

    const after = await image.evaluate((el) => getComputedStyle(el).transform);
    expect(after).not.toBe(before);
  });

  test('is not registered on mobile widths', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const image = page.locator('[data-parallax]');
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(200);

    const transform = await image.evaluate((el) => getComputedStyle(el).transform);
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform);
  });
});
