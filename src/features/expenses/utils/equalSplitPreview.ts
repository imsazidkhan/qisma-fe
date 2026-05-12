import { minorToMajorString, parseAmountToMinor } from '@/features/expenses/utils/amountParsing';

/**
 * Fair minor-unit distribution (extra paise/cents assigned to earlier rows).
 */
export function computeEqualMajorPerPerson(totalMajor: string, count: number): string[] | null {
  const minor = parseAmountToMinor(totalMajor);
  if (minor === null || count < 1) {
    return null;
  }
  const base = Math.floor(minor / count);
  let remainder = minor - base * count;
  const parts: number[] = [];
  for (let i = 0; i < count; i++) {
    let m = base;
    if (remainder > 0) {
      m += 1;
      remainder -= 1;
    }
    parts.push(m);
  }
  return parts.map((m) => minorToMajorString(m));
}
