import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createExpenseReaction } from '@/features/expenses/api/expenseReactionsApi';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type {
  AddExpenseReactionRequestBody,
  ExpenseReactionEntry,
} from '@/features/expenses/types/expenseReaction.types';

export function useAddExpenseReaction(groupId: string, expenseId: string) {
  const queryClient = useQueryClient();
  const gid = groupId.trim();
  const eid = expenseId.trim();

  return useMutation<ExpenseReactionEntry, Error, AddExpenseReactionRequestBody>({
    mutationFn: (body) => createExpenseReaction(gid, eid, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expensesQueryKeys.detail(gid, eid) });
    },
  });
}
