import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
import { patchExpense } from '@/features/expenses/api/expensesApi';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type {
  PatchExpenseBody,
  PatchExpenseResponse,
} from '@/features/expenses/types/expense.types';
import { applyExpenseWriteToCaches } from '@/features/expenses/utils/applyExpenseWriteToCaches';

export function usePatchExpense(groupId: string, expenseId: string) {
  const queryClient = useQueryClient();
  const { data: me } = useAuthMe();

  return useMutation<PatchExpenseResponse, Error, PatchExpenseBody>({
    mutationFn: (body) => patchExpense(groupId, expenseId, body),
    onSuccess: (data) => {
      applyExpenseWriteToCaches(queryClient, data, me?.id);
      void queryClient.invalidateQueries({ queryKey: expensesQueryKeys.detail(expenseId) });
    },
  });
}
