import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createExpenseReaction } from '@/features/expenses/api/expenseReactionsApi';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type {
  AddExpenseReactionRequestBody,
  ExpenseReactionEntry,
} from '@/features/expenses/types/expenseReaction.types';

export function useAddExpenseReaction(expenseId: string) {
  const queryClient = useQueryClient();

  return useMutation<ExpenseReactionEntry, Error, AddExpenseReactionRequestBody>({
    mutationFn: (reqBody) => createExpenseReaction(expenseId, reqBody),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expensesQueryKeys.detail(expenseId) });
    },
  });
}
