/**
 * Coarse calling-code label for **analytics only** — not a full E.164 parse.
 *
 * Replaces greedy `^\+\d{1,3}` matching, which eats subscriber digits on
 * numbers like `+91…` → `+918`.
 */
export function callingCodeBucketForAnalytics(e164: string): string {
  const s = e164.trim();
  if (!s.startsWith('+')) return 'unknown';
  const d = s.slice(1);
  if (!/^\d{8,}$/.test(d)) return 'unknown';

  if (d.startsWith('1')) return '+1';

  if (d.startsWith('20') && d.length - 2 >= 8) return '+20';
  if (d.startsWith('27') && d.length - 2 >= 9) return '+27';

  if ((d.startsWith('2') || d.startsWith('3')) && d.length >= 11) {
    return `+${d.slice(0, 3)}`;
  }

  return `+${d.slice(0, 2)}`;
}
