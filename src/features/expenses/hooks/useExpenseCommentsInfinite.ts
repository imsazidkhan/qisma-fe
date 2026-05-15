import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { listExpenseComments } from '@/features/expenses/api/expenseCommentsApi';
import {
  expenseCommentsInfiniteQueryKey,
  type ExpenseCommentListSort,
} from '@/features/expenses/expenseCommentsQueryKeys';
import { parseExpenseCommentApiError } from '@/features/expenses/utils/expenseCommentApiErrors';

export type UseExpenseCommentsInfiniteOptions = {
  groupId: string;
  expenseId: string;
  /** Omit / empty → top-level thread only. */
  parentCommentId?: string | null;
  /** Default `desc` — chat-style: first page newest-first; cursor pages are older. */
  sort?: ExpenseCommentListSort;
  limit?: number;
  enabled?: boolean;
};

export function useExpenseCommentsInfinite(options: UseExpenseCommentsInfiniteOptions) {
  const queryClient = useQueryClient();
  const gid = options.groupId.trim();
  const eid = options.expenseId.trim();
  const parentRaw = options.parentCommentId?.trim() ?? '';
  const parentScope = parentRaw === '' ? undefined : parentRaw;
  const sort: ExpenseCommentListSort = options.sort ?? 'desc';
  const key = expenseCommentsInfiniteQueryKey(eid, parentScope, sort);
  const limit = options.limit ?? 20;

  const query = useInfiniteQuery({
    queryKey: key,
    enabled: Boolean(gid && eid) && options.enabled !== false,
    /** Avoid duplicate GETs on tab remount / focus; detail/post flows invalidate when needed. */
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    queryFn: ({ pageParam, signal }) =>
      listExpenseComments({
        groupId: gid,
        expenseId: eid,
        parentCommentId: parentScope ?? null,
        cursor: pageParam ?? undefined,
        limit,
        sort,
        signal,
      }),
    retry: (failureCount, err) => {
      if (failureCount > 0) return false;
      const parsed = parseExpenseCommentApiError(err);
      return parsed.kind !== 'invalid_cursor';
    },
  });

  const recovering = useRef(false);
  useEffect(() => {
    const err = query.error;
    if (!err) return;
    if (recovering.current) return;
    if (parseExpenseCommentApiError(err).kind !== 'invalid_cursor') return;
    recovering.current = true;
    void queryClient.resetQueries({ queryKey: key, exact: true }).finally(() => {
      recovering.current = false;
    });
  }, [query.error, queryClient, key]);

  return query;
}
