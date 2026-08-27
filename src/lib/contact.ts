import type { Lang } from '~/i18n/routes.ts';

export type ContactPayload = {
  name: string;
  email: string;
  subject?: string;
  message: string;
  /** Honeypot. Non-empty means bot; this module drops the submission silently. */
  company: string;
  /** Locale the form was submitted in, so a future backend can reply in-language. */
  lang: Lang;
};

export type ContactResult =
  { ok: true } | { ok: false; reason: 'network' | 'server' | 'validation' };

/** How long the stub takes, so the submitting state is genuinely exercised in development. */
const STUB_LATENCY_MS = 900;

/**
 * TODO(backend): replace this stub with a real POST to the chosen form provider.
 *
 * Contract: resolve `{ ok: true }` on success; NEVER throw — map every failure to a
 * ContactResult so the UI can render t.contact.form.error.*.
 *
 * The rest of the form (validation, states, accessibility, honeypot, i18n) is
 * production-ready and needs no changes when this is implemented.
 *
 * This stub is what ships at launch (specs/09-open-decisions.md §4). The form is
 * complete and correct, and it delivers nothing — the visible mailto: beside it is the
 * real contact path until a backend lands. Anyone shipping this must say so to Keily.
 */
export async function submitContact(payload: ContactPayload): Promise<ContactResult> {
  await new Promise((resolve) => setTimeout(resolve, STUB_LATENCY_MS));

  // Bots get a success page and no log entry, exactly as the real implementation should.
  if (payload.company.trim().length > 0) return { ok: true };

  // Lets the error state be exercised without editing code: /?contact=fail
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('contact') === 'fail') return { ok: false, reason: 'server' };
  }

  console.info('[contact] stubbed submission', payload);
  return { ok: true };
}
