import type {
  CreateGroupExpenseBody,
  ExpenseSplitPayload,
} from '@/features/expenses/types/expense.types';
import type { ExpenseStructuredDraft } from '@/features/expenses/types/expenseTaxonomy.types';
import { isUuid } from '@/features/groups/utils/isUuid';
import { toVeloraqExpenseSplitWire } from '@/features/expenses/utils/expenseSplitVeloraqWire';

function wireMerchantId(value: string | undefined): string | undefined {
  const t = value?.trim() ?? '';
  return isUuid(t) ? t : undefined;
}

export function buildCreateExpenseBodyFromForm(params: {
  title: string;
  amountMajor: string;
  paidByUserId: string;
  date: string;
  currency: string;
  notes: string;
  split: ExpenseSplitPayload;
  structured?: ExpenseStructuredDraft | null;
}): CreateGroupExpenseBody {
  const trimmedNotes = params.notes.trim();
  const body: CreateGroupExpenseBody = {
    title: params.title.trim(),
    amount: params.amountMajor,
    paidByUserId: params.paidByUserId,
    date: params.date.trim(),
    currency: params.currency.trim() || 'INR',
    split: toVeloraqExpenseSplitWire(params.split),
  };
  if (trimmedNotes) {
    body.notes = trimmedNotes;
  }
  const st = params.structured;
  if (st) {
    const merchantId = wireMerchantId(st.merchantId);
    if (merchantId) {
      body.merchantId = merchantId;
    }
  }
  return body;
}
