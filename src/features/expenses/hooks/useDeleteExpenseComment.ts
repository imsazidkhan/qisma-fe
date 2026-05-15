import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteExpenseComment } from '@/features/expenses/api/expenseCommentsApi';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type { DeleteExpenseCommentResponse } from '@/features/expenses/types/expenseComment.types';
import {
  removeCommentAcrossExpenseCommentCaches,
  removeCommentFromDetailPreview,
} from '@/features/expenses/utils/expenseCommentCache';

export function useDeleteExpenseComment(groupId: string, expenseId: string) {
  const queryClient = useQueryClient();
  const gid = groupId.trim();
  const eid = expenseId.trim();

  return useMutation<DeleteExpenseCommentResponse, Error, string>({
    mutationFn: (commentId) => deleteExpenseComment(gid, eid, commentId),
    onSuccess: (_data, commentId) => {
      removeCommentAcrossExpenseCommentCaches(queryClient, eid, commentId);
      removeCommentFromDetailPreview(queryClient, gid, eid, commentId);
      void queryClient.invalidateQueries({ queryKey: expensesQueryKeys.detail(gid, eid) });
    },
  });
}
