import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
import { createGroupExpense, patchExpense } from '@/features/expenses/api/expensesApi';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type {
  CreateExpenseResponse,
  CreateGroupExpenseBody,
  PatchExpenseBody,
} from '@/features/expenses/types/expense.types';
import { applyExpenseWriteToCaches } from '@/features/expenses/utils/applyExpenseWriteToCaches';

export type ExpenseWriteTarget =
  | { mode: 'create'; groupId: string }
  | { mode: 'edit'; groupId: string; expenseId: string };

export function useExpenseWrite(target: ExpenseWriteTarget) {
  const queryClient = useQueryClient();
  const { data: me } = useAuthMe();

  return useMutation<CreateExpenseResponse, Error, CreateGroupExpenseBody | PatchExpenseBody>({
    mutationFn: (body) => {
      if (target.mode === 'create') {
        return createGroupExpense(target.groupId, body as CreateGroupExpenseBody);
      }
      return patchExpense(target.groupId, target.expenseId, body as PatchExpenseBody);
    },
    onSuccess: (data) => {
      applyExpenseWriteToCaches(queryClient, data, me?.id, { routeGroupId: target.groupId });
      const exp = data.expense;
      const gid = exp?.groupId?.trim() || target.groupId.trim();
      const eid = exp?.id?.trim();
      if (gid && eid) {
        void queryClient.invalidateQueries({
          queryKey: expensesQueryKeys.detail(gid, eid),
        });
      }
    },
  });
}
