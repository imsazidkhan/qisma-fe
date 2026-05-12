/**
 * Symbol for UI amount heroes (e.g. ₹, $) — theme-agnostic formatting helper.
 */
export function getCurrencyDisplaySymbol(currency: string, locale: string = 'en-IN'): string {
  const code = currency.trim().toUpperCase() || 'INR';
  try {
    const part = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .formatToParts(0)
      .find((p) => p.type === 'currency');
    return part?.value ?? code;
  } catch {
    return code;
  }
}
