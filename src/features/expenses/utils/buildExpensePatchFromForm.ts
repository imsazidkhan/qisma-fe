import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';
import type {
  ExpenseSplitPayload,
  PatchExpenseBody,
} from '@/features/expenses/types/expense.types';
import {
  appendStructuredPatchDiff,
  type ExpenseStructuredPatchSnapshot,
} from '@/features/expenses/utils/expenseStructuredPatch';

function pickDetailNotes(detail: ExpenseDetail): string {
  const raw = (detail as { notes?: unknown }).notes;
  return typeof raw === 'string' ? raw : '';
}

/**
 * Scalar-diffed PATCH body. Always includes `split` so the server receives consistent split lines
 * (required when amount or payer changes — see {@link assertExpensePatchIncludesSplitWhenRequired}).
 */
export function buildExpensePatchFromForm(params: {
  detail: ExpenseDetail;
  title: string;
  amountMajor: string;
  paidByUserId: string;
  date: string;
  currency: string;
  notes: string;
  split: ExpenseSplitPayload;
  structuredBaseline?: ExpenseStructuredPatchSnapshot;
  structuredDraft?: ExpenseStructuredPatchSnapshot;
}): PatchExpenseBody {
  const { detail, title, amountMajor, paidByUserId, date, currency, notes, split } = params;
  const patch: PatchExpenseBody = { split };
  const trimmedTitle = title.trim();
  if (trimmedTitle !== detail.title) {
    patch.title = trimmedTitle;
  }
  if (amountMajor !== detail.amount) {
    patch.amount = amountMajor;
  }
  if (paidByUserId !== detail.paidByUserId) {
    patch.paidByUserId = paidByUserId;
  }
  if (date !== detail.date) {
    patch.date = date;
  }
  if (currency !== detail.currency) {
    patch.currency = currency;
  }
  const trimmedNotes = notes.trim();
  if (trimmedNotes !== pickDetailNotes(detail)) {
    patch.notes = trimmedNotes;
  }
  if (params.structuredBaseline !== undefined && params.structuredDraft !== undefined) {
    appendStructuredPatchDiff(patch, params.structuredBaseline, params.structuredDraft);
  }
  return patch;
}
