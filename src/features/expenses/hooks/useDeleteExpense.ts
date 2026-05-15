import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
import { deleteExpense } from '@/features/expenses/api/expensesApi';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type { DeleteExpenseResponse } from '@/features/expenses/types/expense.types';
import { applyExpenseWriteToCaches } from '@/features/expenses/utils/applyExpenseWriteToCaches';

export function useDeleteExpense(groupId: string, expenseId: string) {
  const queryClient = useQueryClient();
  const { data: me } = useAuthMe();
  const gid = groupId.trim();
  const eid = expenseId.trim();

  return useMutation<DeleteExpenseResponse, Error, void>({
    mutationFn: () => deleteExpense(gid, eid),
    onSuccess: (data) => {
      applyExpenseWriteToCaches(queryClient, data, me?.id, { routeGroupId: gid });
      queryClient.removeQueries({ queryKey: expensesQueryKeys.detail(gid, eid) });
    },
  });
}
