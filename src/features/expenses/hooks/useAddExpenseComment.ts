import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createExpenseComment } from '@/features/expenses/api/expenseCommentsApi';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';
import type {
  AddExpenseCommentRequestBody,
  ExpenseCommentEntry,
} from '@/features/expenses/types/expenseComment.types';

function commentToDetailRow(c: ExpenseCommentEntry): Record<string, unknown> {
  return {
    id: c.id,
    userId: c.userId,
    message: c.message,
    createdAt: c.createdAt,
    author: c.author,
  };
}

export function useAddExpenseComment(expenseId: string) {
  const queryClient = useQueryClient();

  return useMutation<ExpenseCommentEntry, Error, AddExpenseCommentRequestBody>({
    mutationFn: (body) => createExpenseComment(expenseId, body),
    onSuccess: (entry) => {
      queryClient.setQueryData<ExpenseDetail | undefined>(
        expensesQueryKeys.detail(expenseId),
        (previous) => {
          if (!previous) return previous;
          return {
            ...previous,
            comments: [...previous.comments, commentToDetailRow(entry)],
          };
        },
      );
    },
  });
}
