import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import type { ExpenseCommentListSort } from '@/features/expenses/expenseCommentsQueryKeys';
import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';
import type { ExpenseCommentEntry } from '@/features/expenses/types/expenseComment.types';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';

export type ExpenseCommentPage = {
  items: ExpenseCommentEntry[];
  nextCursor: string | null;
};

/** Collapses infinite pages in on-screen order: oldest → newest for chat-style `desc` API lists. */
export function mergeExpenseCommentInfinitePages(
  pages: { items: ExpenseCommentEntry[] }[] | undefined,
  sort: ExpenseCommentListSort,
): ExpenseCommentEntry[] {
  const merged = pages?.flatMap((p) => p.items) ?? [];
  if (sort === 'desc') {
    return [...merged].reverse();
  }
  return merged;
}

export function expenseCommentToDetailPreviewRow(
  entry: ExpenseCommentEntry,
): Record<string, unknown> {
  return {
    id: entry.id,
    userId: entry.userId,
    message: entry.message,
    parentCommentId: entry.parentCommentId,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    author: {
      id: entry.user.id,
      name: entry.user.name,
      username: entry.user.username,
      avatar: entry.user.avatar,
    },
    user: entry.user,
  };
}

export function insertCreatedExpenseCommentIntoInfiniteCache(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  entry: ExpenseCommentEntry,
  sort: ExpenseCommentListSort,
): void {
  queryClient.setQueryData<InfiniteData<ExpenseCommentPage>>(queryKey, (old) => {
    if (!old) {
      return { pages: [{ items: [entry], nextCursor: null }], pageParams: [undefined] };
    }
    if (old.pages.length === 0) {
      return { ...old, pages: [{ items: [entry], nextCursor: null }] };
    }
    if (sort === 'desc') {
      const pages = old.pages.map((page, i) =>
        i === 0 ? { ...page, items: [entry, ...page.items] } : page,
      );
      return { ...old, pages };
    }
    const lastIndex = old.pages.length - 1;
    const pages = old.pages.map((page, i) =>
      i === lastIndex ? { ...page, items: [...page.items, entry] } : page,
    );
    return { ...old, pages };
  });
}

export function replaceCommentInInfiniteCache(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  entry: ExpenseCommentEntry,
): void {
  queryClient.setQueryData<InfiniteData<ExpenseCommentPage>>(queryKey, (old) => {
    if (!old) return old;
    const pages = old.pages.map((page) => ({
      ...page,
      items: page.items.map((c) => (c.id === entry.id ? entry : c)),
    }));
    return { ...old, pages };
  });
}

export function removeCommentFromInfiniteCache(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  commentId: string,
): void {
  queryClient.setQueryData<InfiniteData<ExpenseCommentPage>>(queryKey, (old) => {
    if (!old) return old;
    const pages = old.pages.map((page) => ({
      ...page,
      items: page.items.filter((c) => c.id !== commentId),
    }));
    return { ...old, pages };
  });
}

export function forEachExpenseCommentInfiniteQuery(
  queryClient: QueryClient,
  expenseId: string,
  fn: (queryKey: readonly unknown[]) => void,
): void {
  const cache = queryClient.getQueryCache();
  const queries = cache.findAll({
    predicate: (q) => {
      const k = q.queryKey;
      return (
        Array.isArray(k) &&
        k.length >= 4 &&
        k[0] === 'expense' &&
        k[1] === expenseId &&
        k[2] === 'comments'
      );
    },
  });
  for (const q of queries) {
    fn(q.queryKey as readonly unknown[]);
  }
}

export function replaceCommentAcrossExpenseCommentCaches(
  queryClient: QueryClient,
  expenseId: string,
  entry: ExpenseCommentEntry,
): void {
  forEachExpenseCommentInfiniteQuery(queryClient, expenseId, (key) => {
    replaceCommentInInfiniteCache(queryClient, key, entry);
  });
}

export function removeCommentAcrossExpenseCommentCaches(
  queryClient: QueryClient,
  expenseId: string,
  commentId: string,
): void {
  forEachExpenseCommentInfiniteQuery(queryClient, expenseId, (key) => {
    removeCommentFromInfiniteCache(queryClient, key, commentId);
  });
}

export function removeCommentFromDetailPreview(
  queryClient: QueryClient,
  groupId: string,
  expenseId: string,
  commentId: string,
): void {
  queryClient.setQueryData<ExpenseDetail | undefined>(
    expensesQueryKeys.detail(groupId, expenseId),
    (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        comments: prev.comments.filter((row) => {
          const id = typeof row.id === 'string' ? row.id : '';
          return id !== commentId;
        }),
      };
    },
  );
}

export function replaceCommentInDetailPreview(
  queryClient: QueryClient,
  groupId: string,
  expenseId: string,
  entry: ExpenseCommentEntry,
): void {
  queryClient.setQueryData<ExpenseDetail | undefined>(
    expensesQueryKeys.detail(groupId, expenseId),
    (prev) => {
      if (!prev) return prev;
      const row = expenseCommentToDetailPreviewRow(entry);
      let seen = false;
      const next = prev.comments.map((c) => {
        const id = typeof c.id === 'string' ? c.id : '';
        if (id === entry.id) {
          seen = true;
          return row;
        }
        return c;
      });
      return seen ? { ...prev, comments: next } : prev;
    },
  );
}
