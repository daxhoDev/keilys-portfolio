/**
 * Pure validators. They return a translation KEY, never a message, so copy stays in
 * the dictionaries and the same rule can speak either language.
 *
 * The constraints here are mirrored by real HTML attributes on the inputs, so the
 * no-JS case still gets native validation. See specs/05-pages-and-sections.md § Fields.
 */

export type FieldName = 'name' | 'email' | 'subject' | 'message';
export type ErrorKey = 'required' | 'tooShort' | 'tooLong' | 'invalid';

export const LIMITS = {
  name: { min: 2, max: 80 },
  email: { min: 0, max: 254 },
  subject: { min: 0, max: 120 },
  message: { min: 10, max: 2000 },
} as const satisfies Record<FieldName, { min: number; max: number }>;

export const REQUIRED_FIELDS: FieldName[] = ['name', 'email', 'message'];

/** Deliberately permissive. Anything stricter rejects addresses that genuinely exist. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The character counter appears this far into the message, not from the first keystroke. */
export const COUNTER_THRESHOLD = 1800;

export type FormValues = Record<FieldName, string>;
export type FormErrors = Partial<Record<FieldName, ErrorKey>>;

export function validateField(field: FieldName, rawValue: string): ErrorKey | null {
  const value = rawValue.trim();
  const { min, max } = LIMITS[field];

  if (REQUIRED_FIELDS.includes(field) && value.length === 0) return 'required';
  if (value.length === 0) return null; // optional and empty is fine

  if (value.length > max) return 'tooLong';
  if (min > 0 && value.length < min) return 'tooShort';
  if (field === 'email' && !EMAIL_PATTERN.test(value)) return 'invalid';

  return null;
}

export function validateAll(values: Partial<FormValues>): FormErrors {
  const errors: FormErrors = {};
  for (const field of Object.keys(LIMITS) as FieldName[]) {
    const error = validateField(field, values[field] ?? '');
    if (error) errors[field] = error;
  }
  return errors;
}

/**
 * The honeypot is named `company` and hidden from people. Anything in it means a bot
 * filled every field it could find.
 */
export function isBot(company: string): boolean {
  return company.trim().length > 0;
}
