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

/** A touch drag: pointerType "touch", which is the only kind the lightbox acts on. */
async function drag(
  page: import('@playwright/test').Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  await page.evaluate(
    async ([start, end]) => {
      const stage = document.querySelector('[data-lightbox-stage]')!;
      const base = {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        bubbles: true,
        cancelable: true,
      };

      stage.dispatchEvent(
        new PointerEvent('pointerdown', { ...base, clientX: start.x, clientY: start.y }),
      );

      const steps = 8;
      for (let i = 1; i <= steps; i++) {
        stage.dispatchEvent(
          new PointerEvent('pointermove', {
            ...base,
            clientX: start.x + ((end.x - start.x) * i) / steps,
            clientY: start.y + ((end.y - start.y) * i) / steps,
          }),
        );
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }

      stage.dispatchEvent(
        new PointerEvent('pointerup', { ...base, clientX: end.x, clientY: end.y }),
      );
    },
    [from, to],
  );
}

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

test.describe('bugs that shipped once', () => {
  test('the close and arrow buttons actually respond', async ({ page }) => {
    // They were inside <main>, which open() marked inert — every control was dead.
    await page.goto('/mi-trabajo');
    await page.locator('[data-lightbox-open]').first().click();

    await page.locator('[data-lightbox-next]').first().click();
    await expect(page.locator('[data-lightbox-counter]')).toHaveText('2 de 27');

    await page.locator('[data-lightbox-prev]').first().click();
    await expect(page.locator('[data-lightbox-counter]')).toHaveText('1 de 27');

    await page.locator('[data-lightbox-close]').click();
    await expect(page.locator('[data-lightbox]')).toBeHidden();
  });

  test('the dialog is a direct child of body once initialised', async ({ page }) => {
    await page.goto('/mi-trabajo');
    const parent = await page.evaluate(
      () => document.querySelector('[data-lightbox]')?.parentElement?.tagName,
    );
    expect(parent).toBe('BODY');
  });

  test('a not-yet-loaded photograph shows a spinner, not the previous one', async ({ page }) => {
    // Modest delay: this intercepts all 27 gallery images as well, and the lightbox's
    // own request queues behind them.
    await page.route('**/_astro/*.avif', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      await route.continue();
    });

    await page.goto('/mi-trabajo');
    await page.locator('[data-lightbox-open]').first().click();
    await page.keyboard.press('ArrowRight');

    // The old frame must be gone the moment the counter moves.
    await expect(page.locator('[data-lightbox-spinner]')).toBeVisible();
    await expect(page.locator('[data-lightbox-image]')).not.toHaveAttribute('data-shown');

    await expect(page.locator('[data-lightbox-image]')).toHaveAttribute('data-shown', {
      timeout: 15000,
    });
    await expect(page.locator('[data-lightbox-spinner]')).toBeHidden();
  });

  test('the active filter chip repaints when pressed', async ({ page }) => {
    // The chip announced the change but never repainted: the paint was baked at build.
    await page.goto('/mi-trabajo');
    const all = page.locator('[data-filter="all"]');
    const bw = page.locator('[data-filter="bw"]');

    const background = (locator: typeof all) =>
      locator.evaluate((el) => getComputedStyle(el).backgroundColor);

    const activeColour = await background(all);
    await bw.click();

    await expect(bw).toHaveAttribute('aria-pressed', 'true');

    // Poll: the fill is transitioned, so an immediate read catches it mid-fade.
    await expect.poll(() => background(bw), { timeout: 3000 }).toBe(activeColour);
    await expect.poll(() => background(all), { timeout: 3000 }).not.toBe(activeColour);
  });
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test('a horizontal swipe moves to the next photograph', async ({ page }) => {
    await page.goto('/mi-trabajo');
    await page.locator('[data-lightbox-open]').first().click();
    await expect(page.locator('[data-lightbox-counter]')).toHaveText('1 de 27');

    const stage = page.locator('[data-lightbox-stage]');
    const box = (await stage.boundingBox())!;
    const y = box.y + box.height / 2;

    await drag(page, { x: box.x + box.width * 0.8, y }, { x: box.x + box.width * 0.2, y });

    await expect(page.locator('[data-lightbox-counter]')).toHaveText('2 de 27');
  });

  test('a short drag settles back instead of navigating', async ({ page }) => {
    await page.goto('/mi-trabajo');
    await page.locator('[data-lightbox-open]').first().click();

    const stage = page.locator('[data-lightbox-stage]');
    const box = (await stage.boundingBox())!;
    const y = box.y + box.height / 2;

    // Short: under the threshold, so it must settle back rather than navigate.
    await drag(page, { x: box.x + box.width * 0.5, y }, { x: box.x + box.width * 0.5 - 20, y });

    await expect(page.locator('[data-lightbox-counter]')).toHaveText('1 de 27');
  });

  test('a downward drag closes it', async ({ page }) => {
    await page.goto('/mi-trabajo');
    await page.locator('[data-lightbox-open]').first().click();

    const stage = page.locator('[data-lightbox-stage]');
    const box = (await stage.boundingBox())!;
    const x = box.x + box.width / 2;

    await drag(page, { x, y: box.y + box.height * 0.3 }, { x, y: box.y + box.height * 0.8 });

    await expect(page.locator('[data-lightbox]')).toBeHidden();
  });
});
