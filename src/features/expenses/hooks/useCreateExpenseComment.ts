import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createExpenseComment } from '@/features/expenses/api/expenseCommentsApi';
import {
  expenseCommentsInfiniteQueryKey,
  type ExpenseCommentListSort,
} from '@/features/expenses/expenseCommentsQueryKeys';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type {
  AddExpenseCommentRequestBody,
  ExpenseCommentEntry,
} from '@/features/expenses/types/expenseComment.types';
import { insertCreatedExpenseCommentIntoInfiniteCache } from '@/features/expenses/utils/expenseCommentCache';

export type UseCreateExpenseCommentOptions = {
  /** Must match the infinite list hook; default `desc`. */
  listSort?: ExpenseCommentListSort;
};

export function useCreateExpenseComment(
  groupId: string,
  expenseId: string,
  options?: UseCreateExpenseCommentOptions,
) {
  const queryClient = useQueryClient();
  const gid = groupId.trim();
  const eid = expenseId.trim();
  const listSort: ExpenseCommentListSort = options?.listSort ?? 'desc';

  return useMutation<ExpenseCommentEntry, Error, AddExpenseCommentRequestBody>({
    mutationFn: (body) => createExpenseComment(gid, eid, body),
    onSuccess: (entry) => {
      const parent = entry.parentCommentId?.trim() ?? '';
      const infiniteKey = expenseCommentsInfiniteQueryKey(
        eid,
        parent === '' ? undefined : parent,
        listSort,
      );
      insertCreatedExpenseCommentIntoInfiniteCache(queryClient, infiniteKey, entry, listSort);
      void queryClient.invalidateQueries({ queryKey: expensesQueryKeys.detail(gid, eid) });
    },
  });
}
