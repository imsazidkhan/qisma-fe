import { useMutation, useQueryClient } from '@tanstack/react-query';

import { patchExpenseComment } from '@/features/expenses/api/expenseCommentsApi';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type { ExpenseCommentEntry } from '@/features/expenses/types/expenseComment.types';
import {
  replaceCommentAcrossExpenseCommentCaches,
  replaceCommentInDetailPreview,
} from '@/features/expenses/utils/expenseCommentCache';

export type PatchExpenseCommentVariables = {
  commentId: string;
  message: string;
};

export function usePatchExpenseComment(groupId: string, expenseId: string) {
  const queryClient = useQueryClient();
  const gid = groupId.trim();
  const eid = expenseId.trim();

  return useMutation<ExpenseCommentEntry, Error, PatchExpenseCommentVariables>({
    mutationFn: ({ commentId, message }) => patchExpenseComment(gid, eid, commentId, { message }),
    onSuccess: (entry) => {
      replaceCommentAcrossExpenseCommentCaches(queryClient, eid, entry);
      replaceCommentInDetailPreview(queryClient, gid, eid, entry);
      void queryClient.invalidateQueries({ queryKey: expensesQueryKeys.detail(gid, eid) });
    },
  });
}
