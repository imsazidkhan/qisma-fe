import type { PatchExpenseBody } from '@/features/expenses/types/expense.types';
import type { ExpenseStructuredWireSnapshot } from '@/features/expenses/utils/readExpenseStructuredWire';

import type { ExpenseClassifyResponse } from '@/features/expenses/types/expenseTaxonomy.types';

export type ExpenseStructuredPatchSnapshot = {
  merchantId: string | null;
};

export function expenseStructuredPatchSnapshotFromClassify(
  data: ExpenseClassifyResponse,
): ExpenseStructuredPatchSnapshot {
  return {
    merchantId: data.merchant?.id ?? null,
  };
}

export function expenseStructuredPatchSnapshotFromWire(
  w: ExpenseStructuredWireSnapshot,
): ExpenseStructuredPatchSnapshot {
  return {
    merchantId: w.merchantId,
  };
}

export function expenseStructuredSnapshotsEqual(
  a: ExpenseStructuredPatchSnapshot,
  b: ExpenseStructuredPatchSnapshot,
): boolean {
  return a.merchantId === b.merchantId;
}

export function appendStructuredPatchDiff(
  patch: PatchExpenseBody,
  baseline: ExpenseStructuredPatchSnapshot,
  draft: ExpenseStructuredPatchSnapshot,
): void {
  if (expenseStructuredSnapshotsEqual(baseline, draft)) {
    return;
  }
  patch.merchantId = draft.merchantId;
}
