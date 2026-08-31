/**
 * The contact form is HIDDEN, not removed (specs/09-open-decisions.md §4). It has no
 * delivery, and a form promising "te responderé lo antes posible" while sending
 * nothing is worse than no form.
 *
 * So this file does two jobs: it holds the form to being genuinely absent from the
 * page, and it keeps the component's contract under test while it is dormant — against
 * the source rather than the DOM. Otherwise the form rots in the dark and turning it
 * back on becomes a rewrite.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { SITE } from '../src/lib/site.ts';
import { es } from '../src/i18n/es.ts';
import { en } from '../src/i18n/en.ts';
import { LIMITS, errorAttribute, type ErrorKey } from '../src/lib/validation.ts';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const html = (route: string) =>
  readFileSync(
    join(DIST, route === '/' ? 'index.html' : `${route.replace(/^\//, '')}/index.html`),
    'utf8',
  );
const source = (path: string) => readFileSync(join(ROOT, path), 'utf8');

const LANDINGS = [
  { route: '/', dict: es },
  { route: '/en', dict: en },
] as const;

before(() => assert.ok(existsSync(DIST), 'run `npm run build` first'));

describe('the form is hidden while it has no backend', () => {
  for (const { route } of LANDINGS) {
    test(`${route} renders no form at all`, () => {
      const page = html(route);
      assert.ok(!/<form/.test(page), 'a form is on the page but cannot deliver anything');
      assert.ok(!page.includes('data-contact-form'), 'the form markup is still rendered');
    });
  }

  test('its controller is not shipped either', () => {
    // Dead weight in the bundle, and it would bind to nothing.
    assert.ok(!html('/').includes('data-form-submit'), 'the submit button is still emitted');
  });

  for (const { route, dict } of LANDINGS) {
    test(`${route} still offers a way to make contact`, () => {
      const page = html(route);
      assert.ok(page.includes(`mailto:${SITE.email}`), 'no mailto — the section is a dead end');
      assert.ok(page.includes(dict.contact.socials.instagramGallery), 'no Instagram either');
      assert.ok(page.includes(dict.contact.lead), 'her invitation to write is gone too');
    });
  }
});

describe('the form survives intact, ready to be switched on', () => {
  const files = [
    'src/components/form/ContactForm.astro',
    'src/components/form/Field.astro',
    'src/components/form/FormStatus.astro',
    'src/scripts/contact-form.ts',
    'src/lib/contact.ts',
    'src/lib/validation.ts',
  ];

  test('every part of it is still on disk', () => {
    for (const file of files) assert.ok(existsSync(join(ROOT, file)), `${file} was deleted`);
  });

  test('it is commented out at one call site, not disabled from within', () => {
    const section = source('src/components/sections/ContactSection.astro');
    assert.match(section, /HIDDEN, NOT REMOVED/, 'no explanation of why it is gone');
    assert.match(
      section,
      /<ContactForm \{lang\} \/>/,
      'the call site was deleted rather than commented',
    );

    // The component itself must not have been hollowed out to hide it.
    const form = source('src/components/form/ContactForm.astro');
    assert.ok(!/\bhidden\b\s*$/m.test(form.split('\n')[0]), 'the form hides itself');
  });

  test('the restore instructions name the one thing that actually blocks it', () => {
    const section = source('src/components/sections/ContactSection.astro');
    assert.match(section, /submitContact/, 'nothing says what has to be implemented');
  });
});

describe('the component contract, checked against its source', () => {
  const form = source('src/components/form/ContactForm.astro');
  const field = source('src/components/form/Field.astro');
  const status = source('src/components/form/FormStatus.astro');

  test('all four fields are still declared', () => {
    for (const name of ['name', 'email', 'subject', 'message']) {
      assert.match(form, new RegExp(`name="${name}"`), `${name} is gone`);
    }
  });

  test('the honeypot is still hidden three ways and still not required', () => {
    assert.match(form, /name="company"/);
    assert.match(form, /tabindex="-1"/);
    assert.match(form, /autocomplete="off"/);
    assert.match(form, /aria-hidden="true"/);

    const honeypot = form.match(/<input id="contact-company"[^>]*>/)![0];
    assert.ok(!/\brequired\b/.test(honeypot), 'a person who finds it could not submit');
  });

  test('native constraints are still declared alongside novalidate', () => {
    assert.match(form, /novalidate/);
    assert.match(form, new RegExp(`minlength=\\{LIMITS.message.min\\}`));
    assert.match(form, new RegExp(`maxlength=\\{LIMITS.message.max\\}`));
    assert.equal(LIMITS.message.max, 2000);
  });

  test('every error message still reaches an attribute the controller reads', () => {
    // The bug this guards shipped once: the attribute name and the dataset key the
    // script reads had drifted, so errors rendered as a bare icon.
    assert.match(field, /errorAttribute/, 'Field no longer derives the attribute name');
    const controller = source('src/scripts/contact-form.ts');
    assert.match(controller, /errorDatasetKey/, 'the controller hand-rolls the key again');

    for (const key of ['required', 'tooShort', 'tooLong', 'invalid'] as ErrorKey[]) {
      assert.match(errorAttribute(key), /^data-error-[a-z-]+$/);
    }
  });

  test('the states are still present and still announced', () => {
    assert.match(status, /data-form-success[\s\S]*role="status"/);
    assert.match(status, /data-form-error[\s\S]*role="alert"/);
    assert.match(status, /tabindex="-1"/, 'focus could not be moved to a panel');
  });

  test('the panels are outside the form element', () => {
    // They were inside it once, and setState hides the form to show them — so a
    // successful submit hid its own confirmation.
    const formTag = form.match(/<form[\s\S]*?<\/form>/)![0];
    assert.ok(!formTag.includes('<FormStatus'), 'the success panel is inside the form again');
    assert.match(form, /<FormStatus \{lang\} \/>/, 'the panels are gone entirely');
  });

  test('fields go readonly, never disabled, while submitting', () => {
    const controller = source('src/scripts/contact-form.ts');
    assert.match(controller, /field\.readOnly = busy/);
    // The submit button is legitimately disabled while busy; the FIELDS must not be,
    // because a disabled field leaves the accessibility tree and takes the value the
    // person just typed with it.
    assert.ok(!/field\.disabled/.test(controller), 'a field is disabled rather than readonly');
    assert.match(
      controller,
      /submitButton\.disabled = busy/,
      'the button stays clickable while busy',
    );
  });
});

describe('the stub still tells the truth', () => {
  const contact = source('src/lib/contact.ts');

  test('it is still marked as the one thing standing between this and a real form', () => {
    assert.match(contact, /TODO\(backend\)/);
  });

  test('bots would still get success and no log entry', () => {
    const botBranch = contact.indexOf('payload.company');
    const logLine = contact.indexOf('console.info');
    assert.ok(botBranch > 0 && botBranch < logLine, 'the honeypot must return before logging');
  });
});
