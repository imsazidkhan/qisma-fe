/** API list ordering; included in keys so a sort change drops cursor state and refetches page 1. */
export type ExpenseCommentListSort = 'asc' | 'desc';

/** Stable keys per Veloraq threading scope (`cursor` is scoped to `parentCommentId` + `sort`). */
export const expenseCommentsQueryKeys = {
  root: (expenseId: string, sort: ExpenseCommentListSort) =>
    ['expense', expenseId, 'comments', 'root', sort] as const,
  replies: (expenseId: string, rootCommentId: string, sort: ExpenseCommentListSort) =>
    ['expense', expenseId, 'comments', 'replies', rootCommentId, sort] as const,
} as const;

export function expenseCommentsInfiniteQueryKey(
  expenseId: string,
  parentCommentId: string | undefined | null,
  sort: ExpenseCommentListSort = 'desc',
): readonly unknown[] {
  const root = expenseId.trim();
  const parent = parentCommentId?.trim() ?? '';
  const ordering: ExpenseCommentListSort = sort;
  if (parent === '') return expenseCommentsQueryKeys.root(root, ordering);
  return expenseCommentsQueryKeys.replies(root, parent, ordering);
}
