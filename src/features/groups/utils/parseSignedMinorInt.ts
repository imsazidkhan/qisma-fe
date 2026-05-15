/**
 * Parses backend minor-unit integers (often JSON strings) to a signed integer.
 * Matches conventions used for `netMinor` / `balanceNetMinor` on balances + home cards.
 */
export function parseSignedMinorInt(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.trunc(raw);
  }
  if (typeof raw === 'string') {
    const t = raw.trim().replace(/,/g, '');
    if (t === '') return 0;
    const n = Number.parseInt(t, 10);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
