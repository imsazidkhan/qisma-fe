/* eslint-disable import/first -- `vi.mock` is hoisted; imports below pull mocked modules. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fxExpenseComment,
  FX_COMMENT_ID,
  FX_ROOT_ID,
} from '@/features/expenses/__tests__/expenseComment.fixtures';
import { expenseCommentsInfiniteQueryKey } from '@/features/expenses/expenseCommentsQueryKeys';

vi.mock('@/features/expenses/api/expenseCommentsApi', async (importOriginal) => {
  const mod =
    (await importOriginal()) as typeof import('@/features/expenses/api/expenseCommentsApi');
  return {
    ...mod,
    createExpenseComment: vi.fn(),
    patchExpenseComment: vi.fn(),
    deleteExpenseComment: vi.fn(),
  };
});

import {
  createExpenseComment,
  deleteExpenseComment,
  patchExpenseComment,
} from '@/features/expenses/api/expenseCommentsApi';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';
import { useCreateExpenseComment } from '@/features/expenses/hooks/useCreateExpenseComment';
import { useDeleteExpenseComment } from '@/features/expenses/hooks/useDeleteExpenseComment';
import { usePatchExpenseComment } from '@/features/expenses/hooks/usePatchExpenseComment';

const gid = '660e8400-e29b-41d4-a716-446655440010';
const eid = '660e8400-e29b-41d4-a716-446655440011';

function createWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe('expense comment mutations', () => {
  beforeEach(() => {
    vi.mocked(createExpenseComment).mockReset();
    vi.mocked(patchExpenseComment).mockReset();
    vi.mocked(deleteExpenseComment).mockReset();
  });

  it('create top-level appends to root infinite cache and invalidates detail', async () => {
    const entry = fxExpenseComment({ id: '770e8400-e29b-41d4-a716-446655440060', message: 'new' });
    vi.mocked(createExpenseComment).mockResolvedValue(entry);

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const inv = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useCreateExpenseComment(gid, eid), {
      wrapper: createWrapper(qc),
    });

    await result.current.mutateAsync({ message: 'new' });

    const key = expenseCommentsInfiniteQueryKey(eid, undefined);
    const cached = qc.getQueryData(key)?.pages?.flatMap((p) => p.items) ?? [];
    expect(cached.some((c) => c.id === entry.id)).toBe(true);

    expect(inv).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expensesQueryKeys.detail(gid, eid) }),
    );
  });

  it('create reply targets replies infinite cache', async () => {
    const entry = fxExpenseComment({
      id: '770e8400-e29b-41d4-a716-446655440061',
      parentCommentId: FX_ROOT_ID,
      message: 'reply-body',
    });
    vi.mocked(createExpenseComment).mockResolvedValue(entry);

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useCreateExpenseComment(gid, eid), {
      wrapper: createWrapper(qc),
    });

    await result.current.mutateAsync({ message: 'reply-body', parentCommentId: FX_ROOT_ID });

    const key = expenseCommentsInfiniteQueryKey(eid, FX_ROOT_ID);
    const cached = qc.getQueryData(key)?.pages?.flatMap((p) => p.items) ?? [];
    expect(cached.some((c) => c.id === entry.id)).toBe(true);
  });

  it('patch replaces cached rows by id', async () => {
    const updated = fxExpenseComment({ id: FX_COMMENT_ID, message: 'v2' });
    vi.mocked(patchExpenseComment).mockResolvedValue(updated);

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const replyKey = expenseCommentsInfiniteQueryKey(eid, FX_ROOT_ID);
    qc.setQueryData(replyKey, {
      pages: [{ items: [fxExpenseComment({ id: FX_COMMENT_ID })], nextCursor: null }],
      pageParams: [undefined],
    });

    const { result } = renderHook(() => usePatchExpenseComment(gid, eid), {
      wrapper: createWrapper(qc),
    });

    await result.current.mutateAsync({ commentId: FX_COMMENT_ID, message: 'v2' });

    const row = qc.getQueryData(replyKey)?.pages?.[0]?.items.find((c) => c.id === FX_COMMENT_ID);
    expect(row?.message).toBe('v2');
  });

  it('delete removes cached rows and detail preview entries', async () => {
    vi.mocked(deleteExpenseComment).mockResolvedValue({
      commentId: FX_COMMENT_ID,
      deletedAt: '2022-01-01T00:00:00.000Z',
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const rootKey = expenseCommentsInfiniteQueryKey(eid, undefined);
    qc.setQueryData(rootKey, {
      pages: [{ items: [fxExpenseComment({ id: FX_COMMENT_ID })], nextCursor: null }],
      pageParams: [undefined],
    });
    qc.setQueryData(expensesQueryKeys.detail(gid, eid), {
      groupId: gid,
      comments: [{ id: FX_COMMENT_ID }],
    } as unknown as ExpenseDetail);

    const { result } = renderHook(() => useDeleteExpenseComment(gid, eid), {
      wrapper: createWrapper(qc),
    });

    await result.current.mutateAsync(FX_COMMENT_ID);

    const flat = qc.getQueryData(rootKey)?.pages?.flatMap((p) => p.items) ?? [];
    expect(flat.some((c) => c.id === FX_COMMENT_ID)).toBe(false);

    const detail = qc.getQueryData(expensesQueryKeys.detail(gid, eid));
    const rows = detail?.comments ?? [];
    expect(
      rows.some(
        (r) =>
          typeof (r as { id?: string }).id === 'string' &&
          (r as { id: string }).id === FX_COMMENT_ID,
      ),
    ).toBe(false);
  });
});
