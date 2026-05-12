import { maskPhoneE164 } from '@/utils/phone';

/** Digits-only or E.164 — normalize for masking where possible. */
export function formatProfileIdentifierForDisplay(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  const e164Like = t.startsWith('+') ? t : /^\d{10,15}$/.test(t) ? `+${t}` : t;
  if (e164Like.startsWith('+') && e164Like.length >= 10) {
    return maskPhoneE164(e164Like);
  }
  return t;
}
