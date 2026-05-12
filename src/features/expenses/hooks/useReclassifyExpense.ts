import { useMutation } from '@tanstack/react-query';

import {
  reclassifyExpense,
  type ReclassifyExpenseBody,
} from '@/features/expenses/api/expenseCategoriesApi';

export function useReclassifyExpense() {
  return useMutation({
    mutationFn: ({
      expenseId,
      body,
      signal,
    }: {
      expenseId: string;
      body: ReclassifyExpenseBody;
      signal?: AbortSignal;
    }) => reclassifyExpense(expenseId, body, signal),
    retry: false,
  });
}
