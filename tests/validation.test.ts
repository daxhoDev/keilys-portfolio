/**
 * The validators are pure and return translation keys, so they can be tested exactly
 * without a DOM, a language, or a form.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateField,
  validateAll,
  isBot,
  LIMITS,
  REQUIRED_FIELDS,
  EMAIL_PATTERN,
  COUNTER_THRESHOLD,
} from '../src/lib/validation.ts';

describe('required fields', () => {
  test('empty required fields report "required"', () => {
    for (const field of REQUIRED_FIELDS) {
      assert.equal(validateField(field, ''), 'required', field);
      assert.equal(validateField(field, '   '), 'required', `${field} (whitespace only)`);
    }
  });

  test('an empty optional field is valid', () => {
    assert.equal(validateField('subject', ''), null);
    assert.equal(validateField('subject', '   '), null);
  });
});

describe('lengths', () => {
  test('a name is measured after trimming, not before', () => {
    assert.equal(validateField('name', 'a'), 'tooShort');
    assert.equal(validateField('name', '  a  '), 'tooShort', 'padding must not pass as length');
    assert.equal(validateField('name', 'Jo'), null);
  });

  test('the message floor and ceiling are enforced', () => {
    assert.equal(validateField('message', 'too short'), 'tooShort');
    assert.equal(validateField('message', 'a'.repeat(LIMITS.message.min)), null);
    assert.equal(validateField('message', 'a'.repeat(LIMITS.message.max)), null);
    assert.equal(validateField('message', 'a'.repeat(LIMITS.message.max + 1)), 'tooLong');
  });

  test('every field that can report tooLong actually can be too long', () => {
    // Guards against a limit being removed and the branch quietly going dead.
    for (const field of ['name', 'subject', 'message'] as const) {
      assert.equal(validateField(field, 'a'.repeat(LIMITS[field].max + 1)), 'tooLong', field);
    }
  });
});

describe('email', () => {
  test('accepts addresses that really exist', () => {
    for (const address of [
      'keily@example.com',
      'kylieemar0500@gmail.com',
      'first.last+tag@sub.domain.co.uk',
      'a@b.io',
      "o'brien@example.com",
    ]) {
      assert.equal(validateField('email', address), null, address);
    }
  });

  test('rejects what is plainly not an address', () => {
    for (const address of ['keily', 'keily@', '@example.com', 'keily@example', 'a b@example.com']) {
      assert.equal(validateField('email', address), 'invalid', address);
    }
  });

  test('length is checked before shape, so a huge string is not a regex problem', () => {
    const long = `${'a'.repeat(LIMITS.email.max)}@example.com`;
    assert.equal(validateField('email', long), 'tooLong');
  });

  test('the pattern is deliberately permissive rather than clever', () => {
    // A stricter pattern rejects real addresses, which is a worse failure than
    // accepting a typo the person can see for themselves.
    assert.ok(EMAIL_PATTERN.test('very.unusual+but.valid@example.museum'));
  });
});

describe('validateAll', () => {
  test('reports every invalid field at once, keyed by field', () => {
    const errors = validateAll({ name: '', email: 'nope', subject: '', message: 'short' });
    assert.deepEqual(errors, { name: 'required', email: 'invalid', message: 'tooShort' });
  });

  test('a complete, valid form reports nothing', () => {
    assert.deepEqual(
      validateAll({
        name: 'Keily',
        email: 'kylieemar0500@gmail.com',
        subject: '',
        message: 'I would like to talk about a portrait session.',
      }),
      {},
    );
  });

  test('a missing key is treated as empty rather than throwing', () => {
    assert.deepEqual(validateAll({}), { name: 'required', email: 'required', message: 'required' });
  });
});

describe('honeypot', () => {
  test('anything in it means a bot, whitespace excepted', () => {
    assert.equal(isBot(''), false);
    assert.equal(isBot('   '), false);
    assert.equal(isBot('Acme Ltd'), true);
  });
});

describe('constants the UI depends on', () => {
  test('the counter appears near the limit, not from the first keystroke', () => {
    assert.ok(COUNTER_THRESHOLD > 0 && COUNTER_THRESHOLD < LIMITS.message.max);
    assert.equal(COUNTER_THRESHOLD, 1800);
  });
});
