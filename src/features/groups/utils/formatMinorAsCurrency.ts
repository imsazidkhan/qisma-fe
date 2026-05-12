/**
 * Formats minor currency units (e.g. paise) for display — locale-aware.
 * Invalid ISO 4217 codes fall back to a plain decimal so `Intl` never throws into the UI tree.
 */
export function formatMinorAsCurrency(
  amountMinor: number,
  currency: string,
  locale: string = 'en-IN',
): string {
  if (!Number.isFinite(amountMinor)) {
    return '';
  }
  const major = amountMinor / 100;

  const decimalFallback = (): string => {
    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(major);
    } catch {
      return major.toFixed(2);
    }
  };

  const raw = currency.trim().toUpperCase();
  const iso = /^[A-Z]{3}$/.test(raw) ? raw : null;
  if (!iso) {
    return decimalFallback();
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: iso,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${decimalFallback()} ${iso}`;
  }
}

/** Whole major units skip fractional digits (e.g. ₹10,550); otherwise shows cents/paise. */
export function formatMinorAsCurrencyCompact(
  amountMinor: number,
  currency: string,
  locale: string = 'en-IN',
): string {
  if (!Number.isFinite(amountMinor)) {
    return '';
  }
  const major = amountMinor / 100;
  const hasFraction = Math.round(amountMinor % 100) !== 0;

  const decimalFallback = (): string => {
    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: hasFraction ? 2 : 0,
        maximumFractionDigits: hasFraction ? 2 : 0,
      }).format(major);
    } catch {
      return hasFraction ? major.toFixed(2) : String(Math.round(major));
    }
  };

  const raw = currency.trim().toUpperCase();
  const iso = /^[A-Z]{3}$/.test(raw) ? raw : null;
  if (!iso) {
    return decimalFallback();
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: iso,
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: hasFraction ? 2 : 0,
    }).format(major);
  } catch {
    return `${decimalFallback()} ${iso}`;
  }
}
