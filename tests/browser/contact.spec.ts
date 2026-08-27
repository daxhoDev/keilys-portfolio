/**
 * The contact form's behaviour: when errors appear, where focus goes, and what the
 * submitting state does. None of this is visible in the markup.
 *
 * specs/05-pages-and-sections.md § Validation behaviour, § States.
 */
import { test, expect } from '@playwright/test';

const NAME = '[data-field="name"]';
const EMAIL = '[data-field="email"]';
const MESSAGE = '[data-field="message"]';

test.describe('validation timing', () => {
  test('no error while typing a first pass', async ({ page }) => {
    await page.goto('/');
    await page.locator(NAME).fill('K');
    await expect(page.locator('[data-error-for="name"]')).toBeHidden();
  });

  test('an error appears on blur, once the field has been touched', async ({ page }) => {
    await page.goto('/');
    await page.locator(NAME).fill('K');
    await page.locator(NAME).blur();
    await expect(page.locator('[data-error-for="name"]')).toBeVisible();
    await expect(page.locator(NAME)).toHaveAttribute('aria-invalid', 'true');
  });

  test('it clears live as soon as it stops being true', async ({ page }) => {
    await page.goto('/');
    await page.locator(NAME).fill('K');
    await page.locator(NAME).blur();
    await expect(page.locator('[data-error-for="name"]')).toBeVisible();

    await page.locator(NAME).fill('Keily');
    await expect(page.locator('[data-error-for="name"]')).toBeHidden();
    await expect(page.locator(NAME)).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('the error is linked to its field for a screen reader', async ({ page }) => {
    await page.goto('/');
    await page.locator(EMAIL).fill('nope');
    await page.locator(EMAIL).blur();

    const describedBy = await page.locator(EMAIL).getAttribute('aria-describedby');
    expect(describedBy).toContain('contact-email-error');
  });
});

test.describe('submit', () => {
  test('an invalid submit focuses the first invalid field and announces a count', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('[data-form-submit]').click();

    await expect(page.locator(NAME)).toBeFocused();
    await expect(page.locator('[data-form-summary]')).toBeVisible();
    await expect(page.locator('[data-form-summary]')).toContainText('3');
  });

  test('the summary uses the singular phrasing for one field', async ({ page }) => {
    await page.goto('/');
    await page.locator(NAME).fill('Keily');
    await page.locator(EMAIL).fill('keily@example.com');
    await page.locator('[data-form-submit]').click();

    await expect(page.locator('[data-form-summary]')).toHaveText('Hay 1 campo por corregir.');
  });

  test('a valid submit runs the submitting state, then succeeds', async ({ page }) => {
    await page.goto('/');
    await page.locator(NAME).fill('Keily');
    await page.locator(EMAIL).fill('keily@example.com');
    await page.locator(MESSAGE).fill('I would like to ask about a portrait session.');

    await page.locator('[data-form-submit]').click();

    // Fields stay readonly rather than disabled, so their values are still announced.
    await expect(page.locator('[data-form-submit]')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator(NAME)).toHaveJSProperty('readOnly', true);
    await expect(page.locator(NAME)).toHaveJSProperty('disabled', false);

    await expect(page.locator('[data-form-success]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-contact-form]')).toBeHidden();
    await expect(page.locator('[data-form-success-heading]')).toBeFocused();
  });

  test('the error state keeps every value and takes focus', async ({ page }) => {
    await page.goto('/?contact=fail');
    await page.locator(NAME).fill('Keily');
    await page.locator(EMAIL).fill('keily@example.com');
    await page.locator(MESSAGE).fill('I would like to ask about a portrait session.');
    await page.locator('[data-form-submit]').click();

    await expect(page.locator('[data-form-error]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-form-error]')).toBeFocused();
    await expect(page.locator(NAME)).toHaveValue('Keily', { timeout: 1000 });
  });

  test('"write another" restores an empty form', async ({ page }) => {
    await page.goto('/');
    await page.locator(NAME).fill('Keily');
    await page.locator(EMAIL).fill('keily@example.com');
    await page.locator(MESSAGE).fill('I would like to ask about a portrait session.');
    await page.locator('[data-form-submit]').click();

    await expect(page.locator('[data-form-success]')).toBeVisible({ timeout: 5000 });
    await page.locator('[data-form-reset]').click();

    await expect(page.locator('[data-contact-form]')).toBeVisible();
    await expect(page.locator(NAME)).toHaveValue('');
    await expect(page.locator(NAME)).toBeFocused();
  });
});

test.describe('honeypot', () => {
  test('a filled honeypot still reports success, and logs nothing', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', (message) => logs.push(message.text()));

    await page.goto('/');
    await page.locator(NAME).fill('Keily');
    await page.locator(EMAIL).fill('keily@example.com');
    await page.locator(MESSAGE).fill('I would like to ask about a portrait session.');
    await page.locator('[name="company"]').fill('Acme Ltd', { force: true });
    await page.locator('[data-form-submit]').click();

    await expect(page.locator('[data-form-success]')).toBeVisible({ timeout: 5000 });
    expect(logs.filter((line) => line.includes('[contact] stubbed submission'))).toHaveLength(0);
  });

  test('it is not reachable by keyboard', async ({ page }) => {
    await page.goto('/');
    await page.locator(NAME).focus();

    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => (document.activeElement as HTMLInputElement)?.name);
      expect(focused).not.toBe('company');
    }
  });
});

test.describe('the character counter', () => {
  test('stays hidden until near the limit', async ({ page }) => {
    await page.goto('/');
    await page.locator(MESSAGE).fill('a'.repeat(100));
    await expect(page.locator('[data-counter-for="message"]')).toBeHidden();

    await page.locator(MESSAGE).fill('a'.repeat(1850));
    await expect(page.locator('[data-counter-for="message"]')).toBeVisible();
    await expect(page.locator('[data-counter-value]')).toHaveText('1850');
  });
});

test.describe('the message, not just the icon', () => {
  /**
   * Shipped once: the error paragraph unhid with an empty span, so a "too short" name
   * showed an alert icon and no words. The field was correctly marked invalid, and the
   * markup looked fine — it simply said nothing.
   */
  test('a too-short name shows readable text', async ({ page }) => {
    await page.goto('/');
    await page.locator(NAME).fill('K');
    await page.locator(NAME).blur();

    const error = page.locator('[data-error-for="name"]');
    await expect(error).toBeVisible();
    await expect(error).toHaveText(/\S/, { useInnerText: true });
    await expect(error.locator('[data-error-text]')).toHaveText('Tu nombre es demasiado corto.');
  });

  test('every error state a person can reach says something', async ({ page }) => {
    await page.goto('/');

    const cases = [
      { field: NAME, value: 'K', slot: 'name' },
      { field: EMAIL, value: 'nope', slot: 'email' },
      { field: MESSAGE, value: 'short', slot: 'message' },
    ];

    for (const { field, value, slot } of cases) {
      await page.locator(field).fill(value);
      await page.locator(field).blur();

      const text = await page.locator(`[data-error-for="${slot}"] [data-error-text]`).innerText();
      expect(text.trim(), `${slot} rendered an icon with no message`).not.toBe('');
    }
  });

  test('the empty-field message works too, so the fix did not trade one key for another', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('[data-form-submit]').click();

    for (const slot of ['name', 'email', 'message']) {
      const text = await page.locator(`[data-error-for="${slot}"] [data-error-text]`).innerText();
      expect(text.trim(), `${slot} required message is empty`).not.toBe('');
    }
  });
});
