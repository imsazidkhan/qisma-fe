import {
  computeLocalSplitValidation,
  getSplitValidationMessageKey,
  type LocalSplitFormState,
} from '@/features/expenses/utils/localExpenseSplit';

export type AddExpenseSubmitSnapshot = {
  title: string;
  amountMajorNormalized: string;
  dateYmd: string;
  paidByUserId: string;
  includedIds: readonly string[];
  splitForm: LocalSplitFormState;
};

export function payerIsOnSplit(paidByUserId: string, includedIds: readonly string[]): boolean {
  return Boolean(paidByUserId.trim()) && includedIds.includes(paidByUserId);
}

/** First failing rule for confirming the split sheet (same as sticky CTA in {@link SplitExpenseSheet}). */
export function firstSplitSheetDismissBlocker(
  splitForm: LocalSplitFormState,
  paidByUserId: string,
  includedIds: readonly string[],
): string | null {
  const v = computeLocalSplitValidation(splitForm);
  if (v.kind !== 'perfect') {
    return getSplitValidationMessageKey(v);
  }
  if (!payerIsOnSplit(paidByUserId, includedIds)) {
    return 'expenses.add.validation.payerMustBeOnSplit';
  }
  return null;
}

/** First failing rule for posting the expense (title → amount → date → payer → split). */
export function firstAddExpenseSubmitBlocker(snapshot: AddExpenseSubmitSnapshot): string | null {
  if (!snapshot.title.trim()) {
    return 'expenses.add.validationTitle';
  }
  if (!snapshot.amountMajorNormalized || Number(snapshot.amountMajorNormalized) <= 0) {
    return 'expenses.add.validationAmount';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshot.dateYmd.trim())) {
    return 'expenses.add.validationDate';
  }
  if (!payerIsOnSplit(snapshot.paidByUserId, snapshot.includedIds)) {
    return 'expenses.add.validation.payerMustBeOnSplit';
  }
  return firstSplitSheetDismissBlocker(
    snapshot.splitForm,
    snapshot.paidByUserId,
    snapshot.includedIds,
  );
}

export function sumPercentsForParticipants(
  participantIds: readonly string[],
  percentByUserId: Readonly<Record<string, string>>,
): number {
  let s = 0;
  for (const id of participantIds) {
    const raw = (percentByUserId[id] ?? '').replace(/,/g, '').trim();
    if (!raw) continue;
    const n = Number(raw);
    if (Number.isFinite(n)) {
      s += n;
    }
  }
  return s;
}

export function formatPercentTotalForDisplay(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** Remaining percent to allocate for UI copy (clamp 0–100; two-decimal-ish rounding). */
export function percentRemainingDisplayed(assigned: number): number {
  if (!Number.isFinite(assigned)) return 100;
  return Math.max(0, Math.min(100, Math.round((100 - assigned) * 100) / 100));
}
