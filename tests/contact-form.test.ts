/**
 * The contact form as emitted, plus the guarantees the stub has to keep.
 *
 * Behaviour — when errors appear, focus movement, the submitting state — is in
 * tests/browser/contact.spec.ts. A pass here does not mean the form is usable.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { SITE } from '../src/lib/site.ts';
import { es } from '../src/i18n/es.ts';
import { en } from '../src/i18n/en.ts';
import { LIMITS } from '../src/lib/validation.ts';

const DIST = join(import.meta.dirname, '..', 'dist');
const html = (route: string) =>
  readFileSync(
    join(DIST, route === '/' ? 'index.html' : `${route.replace(/^\//, '')}/index.html`),
    'utf8',
  );

const LANDINGS = [
  { route: '/', dict: es },
  { route: '/en', dict: en },
] as const;

before(() => assert.ok(existsSync(DIST), 'run `npm run build` first'));

describe('the form is where it should be', () => {
  for (const { route } of LANDINGS) {
    test(`${route} renders one form with all four fields`, () => {
      const page = html(route);
      assert.equal((page.match(/<form[^>]*data-contact-form/g) ?? []).length, 1);
      for (const field of ['name', 'email', 'subject', 'message']) {
        assert.match(page, new RegExp(`data-field="${field}"`), `missing ${field}`);
      }
    });
  }

  test('it does not appear on pages that do not have it', () => {
    for (const route of ['/sobre-mi', '/mi-trabajo', '/en/about', '/en/my-work']) {
      assert.ok(!html(route).includes('data-contact-form'), route);
    }
  });

  test('the controller ships only where the form does', () => {
    assert.match(html('/'), /contact-form/);
    assert.ok(!html('/sobre-mi').includes('contact-form'));
  });
});

describe('labels and ARIA', () => {
  for (const { route, dict } of LANDINGS) {
    test(`${route}: every control has a real label bound by for/id`, () => {
      const page = html(route);
      for (const [id, label] of [
        ['contact-name', dict.contact.form.name.label],
        ['contact-email', dict.contact.form.email.label],
        ['contact-subject', dict.contact.form.subject.label],
        ['contact-message', dict.contact.form.message.label],
      ]) {
        assert.match(
          page,
          new RegExp(`<label for="${id}"[^>]*>\\s*${label}`),
          `${id} has no label`,
        );
        assert.match(page, new RegExp(`id="${id}"`), `${id} does not exist`);
      }
    });

    test(`${route}: no placeholder is doing a label's job`, () => {
      // Every field has both, and the label is the one that survives autofill.
      const page = html(route);
      const placeholders = (page.match(/placeholder="/g) ?? []).length;
      const labels = (page.match(/<label for="contact-/g) ?? []).length;
      assert.ok(labels >= placeholders, 'a placeholder exists without its label');
    });
  }

  test('error slots exist in the DOM from the start, so aria-describedby is never dangling', () => {
    const page = html('/');
    for (const field of ['name', 'email', 'subject', 'message']) {
      assert.match(page, new RegExp(`data-error-for="${field}"[^>]*role="alert"`), field);
      assert.match(
        page,
        new RegExp(`data-error-for="${field}"[^>]*hidden`),
        `${field} starts visible`,
      );
    }
  });

  test('required fields are marked three ways, not just with an asterisk', () => {
    const page = html('/');
    for (const id of ['contact-name', 'contact-email', 'contact-message']) {
      const tag = page.match(new RegExp(`<(?:input|textarea)[^>]*id="${id}"[^>]*>`))![0];
      assert.match(tag, /required/, `${id} is not required in HTML`);
      assert.match(tag, /aria-describedby="[^"]*required/, `${id} has no described requirement`);
    }
    assert.match(page, /class="sr-only">\s*obligatorio/, 'no hidden text naming the requirement');
  });
});

describe('native constraints survive novalidate', () => {
  test('the form carries novalidate but the inputs keep real attributes', () => {
    const page = html('/');
    assert.match(page, /<form[^>]*novalidate/);

    const message = page.match(/<textarea[^>]*id="contact-message"[^>]*>/)![0];
    assert.match(message, new RegExp(`minlength="${LIMITS.message.min}"`));
    assert.match(message, new RegExp(`maxlength="${LIMITS.message.max}"`));

    const email = page.match(/<input[^>]*id="contact-email"[^>]*>/)![0];
    assert.match(email, /type="email"/, 'the mobile keyboard depends on this');
    assert.match(email, /autocomplete="email"/);
  });
});

describe('honeypot', () => {
  test('is hidden from people three ways and named innocuously', () => {
    const page = html('/');
    const input = page.match(/<input[^>]*name="company"[^>]*>/)![0];
    assert.match(input, /tabindex="-1"/, 'reachable by keyboard');
    assert.match(input, /autocomplete="off"/, 'a password manager would fill it');
    assert.match(
      page,
      /aria-hidden="true"[^>]*>\s*<label for="contact-company"/,
      'announced to screen readers',
    );
  });

  test('it is not a required field, or a person who finds it cannot submit', () => {
    const input = html('/').match(/<input[^>]*name="company"[^>]*>/)![0];
    assert.ok(!/\brequired\b/.test(input));
  });
});

describe('states', () => {
  test('success, error and summary all exist up front and start hidden', () => {
    const page = html('/');
    for (const marker of ['data-form-success', 'data-form-error', 'data-form-summary']) {
      assert.match(page, new RegExp(`${marker}[^>]*hidden`), `${marker} is missing or visible`);
    }
  });

  test('the success panel is announced and focusable', () => {
    const page = html('/');
    assert.match(page, /data-form-success[^>]*role="status"/);
    assert.match(page, /data-form-success-heading[^>]*tabindex="-1"/);
  });

  test('the error panel is an alert and focusable', () => {
    const page = html('/');
    assert.match(page, /data-form-error[^>]*role="alert"/);
    assert.match(page, /data-form-error[^>]*tabindex="-1"/);
  });

  test('both summary phrasings are rendered, so the controller stays language-free', () => {
    for (const { route, dict } of LANDINGS) {
      const page = html(route);
      assert.ok(page.includes(dict.contact.form.errorSummary(1)), `${route}: no singular form`);
      assert.ok(page.includes(dict.contact.form.errorSummary(0)), `${route}: no plural template`);
    }
  });

  test('the submitting label is localised at render time', () => {
    for (const { route, dict } of LANDINGS) {
      assert.match(
        html(route),
        new RegExp(`data-submitting-label="${dict.contact.form.submitting}"`),
      );
    }
  });
});

describe('the form does not pretend to work', () => {
  const contact = readFileSync(join(import.meta.dirname, '..', 'src/lib/contact.ts'), 'utf8');

  test('the stub is still a stub, and still says so', () => {
    assert.match(contact, /TODO\(backend\)/, 'the boundary must stay findable');
    assert.match(contact, /console\.info\('\[contact\] stubbed submission'/);
  });

  test('bots get success and no log entry', () => {
    const botBranch = contact.indexOf('payload.company');
    const logLine = contact.indexOf('console.info');
    assert.ok(botBranch > 0 && botBranch < logLine, 'the honeypot must return before logging');
  });

  test('the mailto fallback is visible, since it is the only path that works in v1', () => {
    for (const { route } of LANDINGS) {
      const page = html(route);
      assert.ok(page.includes(`mailto:${SITE.email}`), `${route}: no mailto`);
      assert.match(page, /<noscript>[\s\S]*mailto:/, `${route}: no no-JS fallback`);
    }
  });
});
