import type { ExpenseSplitType } from '@/features/expenses/types/expense.types';
import { parseAmountToMinor } from '@/features/expenses/utils/amountParsing';
import { computeEqualMajorPerPerson } from '@/features/expenses/utils/equalSplitPreview';

export function computeCurrentUserShareMinor(
  splitType: ExpenseSplitType,
  includedMemberIds: readonly string[],
  currentUserId: string | undefined,
  totalMajorSanitized: string,
  exactByUserId: Readonly<Record<string, string>>,
  percentByUserId: Readonly<Record<string, string>>,
  sharesByUserId: Readonly<Record<string, number>>,
): number | null {
  if (!currentUserId) return null;
  const idx = includedMemberIds.indexOf(currentUserId);
  if (idx < 0) return null;
  const totalMinor = parseAmountToMinor(totalMajorSanitized);
  if (totalMinor === null) return null;

  if (splitType === 'equal') {
    const parts = computeEqualMajorPerPerson(totalMajorSanitized, includedMemberIds.length);
    if (!parts) return null;
    const major = parts[idx] ?? '0';
    return parseAmountToMinor(major);
  }
  if (splitType === 'exact') {
    const raw = (exactByUserId[currentUserId] ?? '').replace(/,/g, '').trim();
    if (!raw) return null;
    return parseAmountToMinor(raw);
  }
  if (splitType === 'percentage') {
    const raw = (percentByUserId[currentUserId] ?? '').replace(/,/g, '').trim();
    const pct = Number(raw);
    if (!Number.isFinite(pct)) return null;
    return Math.round((totalMinor * pct) / 100);
  }
  let sum = 0;
  for (const id of includedMemberIds) {
    const s = sharesByUserId[id] ?? 1;
    if (Number.isFinite(s) && s > 0) sum += s;
  }
  if (sum <= 0) return null;
  const share = sharesByUserId[currentUserId] ?? 1;
  return Math.round((totalMinor * share) / sum);
}

export type AfterSplitResult =
  | { kind: 'getBack'; minor: number }
  | { kind: 'owe'; minor: number }
  | { kind: 'even' }
  | { kind: 'hidden' };

export function computeAfterSplitResult(
  totalMinor: number | null,
  userShareMinor: number | null,
  currentUserId: string | undefined,
  paidByUserId: string,
  includedMemberIds: readonly string[],
): AfterSplitResult {
  if (totalMinor === null || !currentUserId || !paidByUserId.trim()) {
    return { kind: 'hidden' };
  }

  const inSplit = includedMemberIds.includes(currentUserId);

  if (paidByUserId === currentUserId) {
    if (!inSplit) {
      return totalMinor <= 0 ? { kind: 'hidden' } : { kind: 'getBack', minor: totalMinor };
    }
    if (userShareMinor === null) return { kind: 'hidden' };
    const back = totalMinor - userShareMinor;
    if (back <= 0) return { kind: 'even' };
    return { kind: 'getBack', minor: back };
  }

  if (!inSplit) return { kind: 'hidden' };
  if (userShareMinor === null || userShareMinor <= 0) return { kind: 'hidden' };
  return { kind: 'owe', minor: userShareMinor };
}

export function computeMemberAmountMinorForPreview(
  splitType: ExpenseSplitType,
  memberId: string,
  memberIndex: number,
  includedMemberIds: readonly string[],
  totalMajorSanitized: string,
  equalPartsMajor: string[] | null,
  exactByUserId: Readonly<Record<string, string>>,
  percentByUserId: Readonly<Record<string, string>>,
  sharesByUserId: Readonly<Record<string, number>>,
): number | null {
  const totalMinor = parseAmountToMinor(totalMajorSanitized);
  if (totalMinor === null) return null;

  if (splitType === 'equal') {
    if (!equalPartsMajor) return null;
    return parseAmountToMinor(equalPartsMajor[memberIndex] ?? '0');
  }
  if (splitType === 'exact') {
    const raw = (exactByUserId[memberId] ?? '').replace(/,/g, '').trim();
    if (!raw) return null;
    return parseAmountToMinor(raw);
  }
  if (splitType === 'percentage') {
    const raw = (percentByUserId[memberId] ?? '').replace(/,/g, '').trim();
    const pct = Number(raw);
    if (!Number.isFinite(pct)) return null;
    return Math.round((totalMinor * pct) / 100);
  }
  let sum = 0;
  for (const id of includedMemberIds) {
    const s = sharesByUserId[id] ?? 1;
    if (Number.isFinite(s) && s > 0) sum += s;
  }
  if (sum <= 0) return null;
  const share = sharesByUserId[memberId] ?? 1;
  return Math.round((totalMinor * share) / sum);
}

export function formatPctOfTotal(amountMinor: number | null, totalMinor: number | null): string {
  if (amountMinor === null || totalMinor === null || totalMinor <= 0) return '—';
  const p = (amountMinor / totalMinor) * 100;
  const rounded = Math.round(p * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 0.05) {
    return `${Math.round(rounded)}%`;
  }
  return `${rounded.toFixed(1)}%`;
}
