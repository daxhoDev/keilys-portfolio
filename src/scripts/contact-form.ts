/**
 * Contact form controller: validation timing, the state machine, focus management.
 *
 * The rules that matter here are about WHEN an error appears, not whether it is
 * correct. Showing "too short" while someone is still typing their name is hostile,
 * and never showing it until submit is unhelpful — so a field is validated on blur
 * only after it has been touched once, and then live on every keystroke.
 *
 * Messages come from data-error-* attributes rendered by Field.astro, so this file
 * never contains a user-visible string and never needs to know a language exists.
 */
import {
  validateField,
  validateAll,
  errorDatasetKey,
  COUNTER_THRESHOLD,
  type ErrorKey,
  type FieldName,
} from '~/lib/validation.ts';
import { submitContact, type ContactPayload } from '~/lib/contact.ts';
import type { Lang } from '~/i18n/routes.ts';

type State = 'idle' | 'submitting' | 'success' | 'error';

let teardown: (() => void) | null = null;

function initContactForm(): void {
  teardown?.();

  const root = document.querySelector<HTMLElement>('[data-contact]');
  const form = root?.querySelector<HTMLFormElement>('[data-contact-form]');
  if (!root || !form) return;

  const summary = root.querySelector<HTMLElement>('[data-form-summary]');
  const successPanel = root.querySelector<HTMLElement>('[data-form-success]');
  const successHeading = root.querySelector<HTMLElement>('[data-form-success-heading]');
  const errorPanel = root.querySelector<HTMLElement>('[data-form-error]');
  const submitButton = root.querySelector<HTMLButtonElement>('[data-form-submit]');
  const submitLabel = root.querySelector<HTMLElement>('[data-submit-label]');
  const spinner = root.querySelector<HTMLElement>('[data-submit-spinner]');
  const resetButton = root.querySelector<HTMLElement>('[data-form-reset]');
  if (!submitButton || !submitLabel) return;

  const lang = (form.dataset.lang ?? 'es') as Lang;
  const idleLabel = submitLabel.textContent ?? '';
  const submittingLabel = submitButton.dataset.submittingLabel ?? idleLabel;

  const fields = [...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-field]')];
  const touched = new Set<string>();

  const control = (name: FieldName) => fields.find((field) => field.dataset.field === name);
  const errorSlot = (name: string) => root.querySelector<HTMLElement>(`[data-error-for="${name}"]`);

  /** Field.astro rendered every possible message for this field as a data attribute. */
  const messageFor = (element: HTMLElement, key: ErrorKey) =>
    element.dataset[errorDatasetKey(key)] ?? '';

  const showError = (name: string, key: ErrorKey | null) => {
    const element = control(name as FieldName);
    const slot = errorSlot(name);
    if (!element || !slot) return;

    const text = slot.querySelector<HTMLElement>('[data-error-text]');

    if (!key) {
      element.removeAttribute('aria-invalid');
      slot.hidden = true;
      if (text) text.textContent = '';
      // Drop the error from aria-describedby so it is not announced once fixed.
      const described = (element.getAttribute('aria-describedby') ?? '')
        .split(' ')
        .filter((id) => id && id !== slot.id)
        .join(' ');
      if (described) element.setAttribute('aria-describedby', described);
      else element.removeAttribute('aria-describedby');
      return;
    }

    element.setAttribute('aria-invalid', 'true');
    if (text) text.textContent = messageFor(element, key);
    slot.hidden = false;

    const described = new Set(
      (element.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean),
    );
    described.add(slot.id);
    element.setAttribute('aria-describedby', [...described].join(' '));
  };

  const values = (): Record<FieldName, string> => ({
    name: control('name')?.value ?? '',
    email: control('email')?.value ?? '',
    subject: control('subject')?.value ?? '',
    message: control('message')?.value ?? '',
  });

  const setState = (state: State) => {
    const busy = state === 'submitting';

    submitButton.disabled = busy;
    submitButton.setAttribute('aria-busy', busy ? 'true' : 'false');
    submitLabel.textContent = busy ? submittingLabel : idleLabel;
    if (spinner) spinner.hidden = !busy;

    // readonly rather than disabled: a disabled field is removed from the accessibility
    // tree, so a screen reader user loses what they just typed while it submits.
    for (const field of fields) field.readOnly = busy;

    form.hidden = state === 'success';
    if (successPanel) successPanel.hidden = state !== 'success';
    if (errorPanel) errorPanel.hidden = state !== 'error';

    if (state === 'success') successHeading?.focus();
    if (state === 'error') errorPanel?.focus();
  };

  const onBlur = (event: Event) => {
    const field = event.target as HTMLInputElement | HTMLTextAreaElement;
    const name = field.dataset.field as FieldName | undefined;
    if (!name) return;
    touched.add(name);
    showError(name, validateField(name, field.value));
  };

  /** Once an error is on screen, clear it the moment it stops being true. */
  const onInput = (event: Event) => {
    const field = event.target as HTMLInputElement | HTMLTextAreaElement;
    const name = field.dataset.field as FieldName | undefined;
    if (!name) return;

    if (name === 'message') updateCounter(field);
    if (!touched.has(name)) return;
    showError(name, validateField(name, field.value));
  };

  const counter = root.querySelector<HTMLElement>('[data-counter-for="message"]');
  const counterValue = counter?.querySelector<HTMLElement>('[data-counter-value]');

  /** Only appears near the limit — a counter from the first keystroke is nagging. */
  function updateCounter(field: HTMLInputElement | HTMLTextAreaElement): void {
    if (!counter || !counterValue) return;
    const length = field.value.length;
    const max = Number(field.getAttribute('maxlength') ?? 0);

    counter.hidden = length < COUNTER_THRESHOLD;
    counterValue.textContent = String(length);
    counter.classList.toggle('text-danger', max > 0 && length >= max);
    counter.classList.toggle('text-mist', !(max > 0 && length >= max));
  }

  const onSubmit = async (event: SubmitEvent) => {
    event.preventDefault();

    const errors = validateAll(values());
    const invalid = Object.keys(errors) as FieldName[];

    for (const field of fields) {
      const name = field.dataset.field as FieldName | undefined;
      if (name) showError(name, errors[name] ?? null);
    }

    if (invalid.length > 0) {
      for (const name of invalid) touched.add(name);
      if (summary) {
        // Both forms are rendered as attributes; the plural carries 0 as its slot.
        const template =
          invalid.length === 1
            ? (summary.dataset.summarySingular ?? '')
            : (summary.dataset.summaryPlural ?? '').replace('0', String(invalid.length));
        summary.textContent = template;
        summary.hidden = false;
      }
      control(invalid[0])?.focus();
      return;
    }

    if (summary) summary.hidden = true;
    setState('submitting');

    const payload: ContactPayload = {
      ...values(),
      company: (form.querySelector<HTMLInputElement>('[name="company"]')?.value ?? '').trim(),
      lang,
    };

    const result = await submitContact(payload);
    setState(result.ok ? 'success' : 'error');
  };

  const onReset = () => {
    form.reset();
    touched.clear();
    for (const field of fields) showError(field.dataset.field ?? '', null);
    if (counter) counter.hidden = true;
    setState('idle');
    control('name')?.focus();
  };

  for (const field of fields) {
    field.addEventListener('blur', onBlur);
    field.addEventListener('input', onInput);
  }
  form.addEventListener('submit', onSubmit);
  resetButton?.addEventListener('click', onReset);

  teardown = () => {
    for (const field of fields) {
      field.removeEventListener('blur', onBlur);
      field.removeEventListener('input', onInput);
    }
    form.removeEventListener('submit', onSubmit);
    resetButton?.removeEventListener('click', onReset);
    teardown = null;
  };
}

initContactForm();
document.addEventListener('astro:page-load', initContactForm);
document.addEventListener('astro:before-swap', () => teardown?.());
