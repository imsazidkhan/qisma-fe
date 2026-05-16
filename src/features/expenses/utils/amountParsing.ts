export function parseAmountToMinor(amountRaw: string): number | null {
  const normalized = amountRaw.replace(/,/g, '').trim();
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function minorToMajorString(minor: number): string {
  if (!Number.isFinite(minor)) return '0';
  return (minor / 100).toFixed(2);
}

export function sanitizeAmountTyping(text: string): string {
  const normalized = text.normalize('NFKC').replace(/\s+/g, '');
  const cut = normalized.replace(/[^\d.]/g, '');
  const firstDot = cut.indexOf('.');
  if (firstDot === -1) return cut.slice(0, 12);
  const intPart = cut.slice(0, firstDot).replace(/^0+(\d)/, '$1');
  const frac = cut
    .slice(firstDot + 1)
    .replace(/\./g, '')
    .slice(0, 2);
  const intSafe = intPart === '' && frac.length > 0 ? '0' : intPart;
  return frac.length > 0 ? `${intSafe}.${frac}` : `${intSafe}.`;
}

const DIGIT_GROUP = /\B(?=(\d{3})+(?!\d))/g;

function formatIntegerDigitsForDisplay(intDigits: string): string {
  const trimmed = intDigits.replace(/\D/g, '');
  if (trimmed === '') return '0';
  const noLeading = trimmed.replace(/^0+/, '');
  const significant = noLeading === '' ? '0' : noLeading;
  return significant.replace(DIGIT_GROUP, ',');
}

/**
 * Split sanitized amount `value` (no commas) into display integer + fraction
 * (fraction includes the leading dot when non-empty, or a lone `.` while typing).
 */
export function splitAmountDisplayParts(value: string): { integer: string; fraction: string } {
  const v = value.replace(/,/g, '').trim();
  if (v === '') {
    return { integer: '0', fraction: '' };
  }
  const dot = v.indexOf('.');
  if (dot === -1) {
    return {
      integer: formatIntegerDigitsForDisplay(v),
      fraction: '',
    };
  }
  let intRaw = v.slice(0, dot);
  const fracRaw = v
    .slice(dot + 1)
    .replace(/\./g, '')
    .slice(0, 2);
  const intFormatted = formatIntegerDigitsForDisplay(
    intRaw === '' && fracRaw.length > 0 ? '0' : intRaw,
  );
  let fraction: string;
  if (fracRaw.length > 0) {
    fraction = `.${fracRaw}`;
  } else if (v.endsWith('.')) {
    fraction = '.';
  } else {
    fraction = '';
  }
  return { integer: intFormatted, fraction };
}
