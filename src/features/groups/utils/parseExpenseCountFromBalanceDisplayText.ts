/**
 * Best-effort expense count from API `displayText` (e.g. "2 shared expenses").
 * Returns `undefined` when no digit + “expense(s)” pattern is found.
 */
export function parseExpenseCountFromBalanceDisplayText(displayText: string): number | undefined {
  const t = displayText.trim();
  const mPlural = /\b(\d+)\s*expenses\b/i.exec(t);
  if (mPlural) {
    const n = Number.parseInt(mPlural[1] ?? '', 10);
    return Number.isFinite(n) ? n : undefined;
  }
  const mSingular = /\b(\d+)\s*expense\b/i.exec(t);
  if (mSingular) {
    const n = Number.parseInt(mSingular[1] ?? '', 10);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}
