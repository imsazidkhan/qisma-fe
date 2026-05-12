import type {
  CreateGroupExpenseBody,
  ExpenseSplitPayload,
} from '@/features/expenses/types/expense.types';
import type { ExpenseStructuredDraft } from '@/features/expenses/types/expenseTaxonomy.types';

export function buildCreateExpenseBodyFromForm(params: {
  title: string;
  amountMajor: string;
  paidByUserId: string;
  date: string;
  currency: string;
  notes: string;
  split: ExpenseSplitPayload;
  category?: string;
  structured?: ExpenseStructuredDraft | null;
}): CreateGroupExpenseBody {
  const trimmedNotes = params.notes.trim();
  const trimmedCategory = params.category?.trim();
  const body: CreateGroupExpenseBody = {
    title: params.title.trim(),
    amount: params.amountMajor,
    paidByUserId: params.paidByUserId,
    date: params.date.trim(),
    currency: params.currency.trim() || 'INR',
    split: params.split,
  };
  if (trimmedNotes) {
    body.notes = trimmedNotes;
  }
  if (trimmedCategory) {
    body.category = trimmedCategory;
  }
  const st = params.structured;
  if (st) {
    if (st.categoryId) {
      body.categoryId = st.categoryId;
    }
    if (st.subcategoryId) {
      body.subcategoryId = st.subcategoryId;
    }
    if (st.merchantId) {
      body.merchantId = st.merchantId;
    }
    if (st.tagIds.length > 0) {
      body.tagIds = st.tagIds;
    }
  }
  return body;
}
