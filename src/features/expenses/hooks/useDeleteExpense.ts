import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
import { deleteExpense } from '@/features/expenses/api/expensesApi';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type { DeleteExpenseResponse } from '@/features/expenses/types/expense.types';
import { applyExpenseWriteToCaches } from '@/features/expenses/utils/applyExpenseWriteToCaches';

export function useDeleteExpense(expenseId: string) {
  const queryClient = useQueryClient();
  const { data: me } = useAuthMe();

  return useMutation<DeleteExpenseResponse, Error, void>({
    mutationFn: () => deleteExpense(expenseId),
    onSuccess: (data) => {
      applyExpenseWriteToCaches(queryClient, data, me?.id);
      queryClient.removeQueries({ queryKey: expensesQueryKeys.detail(expenseId) });
    },
  });
}
