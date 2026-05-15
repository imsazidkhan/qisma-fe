import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  reclassifyExpense,
  type ReclassifyExpenseBody,
} from '@/features/expenses/api/expenseCategoriesApi';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';

export function useReclassifyExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      expenseId,
      body,
      signal,
    }: {
      groupId: string;
      expenseId: string;
      body: ReclassifyExpenseBody;
      signal?: AbortSignal;
    }) => reclassifyExpense(groupId.trim(), expenseId.trim(), body, signal),
    retry: false,
    onSuccess: (_data, { groupId, expenseId }) => {
      const gid = groupId.trim();
      const eid = expenseId.trim();
      void queryClient.invalidateQueries({ queryKey: expensesQueryKeys.detail(gid, eid) });
      void queryClient.invalidateQueries({ queryKey: ['expenses', 'feed'] });
    },
  });
}
