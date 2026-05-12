import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';

export function participantIdsFromExpenseDetail(detail: ExpenseDetail): string[] {
  const raw = detail.participants
    .map((row) => {
      if (typeof row['userId'] === 'string') return row['userId'];
      if (typeof row['id'] === 'string') return row['id'];
      return null;
    })
    .filter((x): x is string => Boolean(x));
  const uniq = [...new Set(raw)];
  if (uniq.length > 0) return uniq;
  return [detail.paidByUserId];
}
