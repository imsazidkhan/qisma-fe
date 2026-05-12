import type { PatchExpenseBody } from '@/features/expenses/types/expense.types';

function parseAmountComparable(raw: string): number | null {
  const n = Number(String(raw).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

/** True when both strings parse as numbers and are materially equal (minor float tolerance). */
export function expenseAmountStringsEqual(a: string, b: string): boolean {
  const na = parseAmountComparable(a);
  const nb = parseAmountComparable(b);
  if (na !== null && nb !== null) {
    return Math.abs(na - nb) < 1e-9;
  }
  return String(a).trim() === String(b).trim();
}

/**
 * When this returns true, the PATCH body **must** include a full `split` or the API returns
 * `SPLIT_VALIDATION_ERROR` (amount or payer changed vs the current expense).
 */
export function isExpensePatchFinancialChange(
  patch: PatchExpenseBody,
  baseline: { amount: string; paidByUserId: string },
): boolean {
  const amountChanged =
    patch.amount !== undefined && !expenseAmountStringsEqual(patch.amount, baseline.amount);
  const payerChanged =
    patch.paidByUserId !== undefined && patch.paidByUserId !== baseline.paidByUserId;
  return amountChanged || payerChanged;
}

/**
 * Throws if `patch` changes amount/payer but omits `split` — call before `patchExpense`
 * when building UI payloads so failures are local (not a round-trip).
 */
export function assertExpensePatchIncludesSplitWhenRequired(
  patch: PatchExpenseBody,
  baseline: { amount: string; paidByUserId: string },
): void {
  if (isExpensePatchFinancialChange(patch, baseline) && patch.split === undefined) {
    throw new Error(
      'PATCH expense: `amount` or `paidByUserId` changed — include full `split` or the API returns SPLIT_VALIDATION_ERROR.',
    );
  }
}
