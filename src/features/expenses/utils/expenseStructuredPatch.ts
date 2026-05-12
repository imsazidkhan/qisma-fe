import type { PatchExpenseBody } from '@/features/expenses/types/expense.types';
import type { ExpenseStructuredWireSnapshot } from '@/features/expenses/utils/readExpenseStructuredWire';

import type { ExpenseClassifyResponse } from '@/features/expenses/types/expenseTaxonomy.types';
import { expenseStructuredDraftFromClassify } from '@/features/expenses/types/expenseTaxonomy.types';

export type ExpenseStructuredPatchSnapshot = {
  categoryId: string | null;
  subcategoryId: string | null;
  merchantId: string | null;
  tagIds: string[];
};

function normalizeTagIds(ids: string[]): string[] {
  return [...new Set(ids.map((x) => x.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function expenseStructuredPatchSnapshotFromClassify(
  data: ExpenseClassifyResponse,
): ExpenseStructuredPatchSnapshot {
  const d = expenseStructuredDraftFromClassify(data);
  return {
    categoryId: d.categoryId ?? null,
    subcategoryId: d.subcategoryId ?? null,
    merchantId: d.merchantId ?? null,
    tagIds: normalizeTagIds(d.tagIds),
  };
}

export function expenseStructuredPatchSnapshotFromWire(
  w: ExpenseStructuredWireSnapshot,
): ExpenseStructuredPatchSnapshot {
  return {
    categoryId: w.categoryId,
    subcategoryId: w.subcategoryId,
    merchantId: w.merchantId,
    tagIds: normalizeTagIds(w.tagIds),
  };
}

export function expenseStructuredSnapshotsEqual(
  a: ExpenseStructuredPatchSnapshot,
  b: ExpenseStructuredPatchSnapshot,
): boolean {
  return (
    a.categoryId === b.categoryId &&
    a.subcategoryId === b.subcategoryId &&
    a.merchantId === b.merchantId &&
    normalizeTagIds(a.tagIds).join('\0') === normalizeTagIds(b.tagIds).join('\0')
  );
}

export function appendStructuredPatchDiff(
  patch: PatchExpenseBody,
  baseline: ExpenseStructuredPatchSnapshot,
  draft: ExpenseStructuredPatchSnapshot,
): void {
  if (expenseStructuredSnapshotsEqual(baseline, draft)) {
    return;
  }
  patch.categoryId = draft.categoryId;
  patch.subcategoryId = draft.subcategoryId;
  patch.merchantId = draft.merchantId;
  patch.tagIds = normalizeTagIds(draft.tagIds);
}
