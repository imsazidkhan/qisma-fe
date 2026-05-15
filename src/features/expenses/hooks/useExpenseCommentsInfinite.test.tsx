/* eslint-disable import/first -- `vi.mock` is hoisted; imports below pull mocked modules. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/ApiError';
import {
  fxExpenseComment,
  FX_ROOT_ID,
} from '@/features/expenses/__tests__/expenseComment.fixtures';
import { EXPENSE_COMMENT_SERVICE_CODES } from '@/features/expenses/constants/expenseCommentErrors';

vi.mock('@/features/expenses/api/expenseCommentsApi', async (importOriginal) => {
  const mod =
    (await importOriginal()) as typeof import('@/features/expenses/api/expenseCommentsApi');
  return { ...mod, listExpenseComments: vi.fn() };
});

import { listExpenseComments } from '@/features/expenses/api/expenseCommentsApi';
import { useExpenseCommentsInfinite } from '@/features/expenses/hooks/useExpenseCommentsInfinite';

const gid = '660e8400-e29b-41d4-a716-446655440010';
const eid = '660e8400-e29b-41d4-a716-446655440011';

function createWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  vi.mocked(listExpenseComments).mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useExpenseCommentsInfinite', () => {
  it('paginates with opaque cursor until nextCursor is null', async () => {
    vi.mocked(listExpenseComments)
      .mockResolvedValueOnce({
        items: [fxExpenseComment({ id: '770e8400-e29b-41d4-a716-446655440040', message: 'p1' })],
        nextCursor: 'c2',
      })
      .mockResolvedValueOnce({
        items: [fxExpenseComment({ id: '770e8400-e29b-41d4-a716-446655440041', message: 'p2' })],
        nextCursor: null,
      });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(
      () => useExpenseCommentsInfinite({ groupId: gid, expenseId: eid }),
      {
        wrapper: createWrapper(qc),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages).toHaveLength(1);

    await result.current.fetchNextPage();

    await waitFor(() => expect(result.current.data?.pages.length).toBe(2));
    expect(result.current.hasNextPage).toBe(false);
    expect(listExpenseComments).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        cursor: 'c2',
        expenseId: eid,
        groupId: gid,
        sort: 'desc',
      }),
    );
    expect(listExpenseComments).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ sort: 'desc', cursor: undefined }),
    );
  });

  it('uses fresh pagination when parentCommentId scope changes', async () => {
    vi.mocked(listExpenseComments).mockImplementation(async ({ parentCommentId }) => ({
      items: [
        fxExpenseComment({
          id: '770e8400-e29b-41d4-a716-446655440050',
          message: parentCommentId ?? 'ROOT_SCOPE',
          parentCommentId: parentCommentId ?? null,
        }),
      ],
      nextCursor: null,
    }));

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result, rerender } = renderHook(
      ({ parent }: { parent: string | undefined }) =>
        useExpenseCommentsInfinite({ groupId: gid, expenseId: eid, parentCommentId: parent }),
      {
        wrapper: createWrapper(qc),
        initialProps: { parent: undefined as string | undefined },
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0]?.items[0]?.message).toBe('ROOT_SCOPE');

    rerender({ parent: FX_ROOT_ID });

    await waitFor(() => expect(result.current.data?.pages[0]?.items[0]?.message).toBe(FX_ROOT_ID));
    expect(listExpenseComments).toHaveBeenLastCalledWith(
      expect.objectContaining({
        parentCommentId: FX_ROOT_ID,
        cursor: undefined,
        sort: 'desc',
      }),
    );
  });

  it('uses a distinct query cache when sort changes (cursor reset)', async () => {
    vi.mocked(listExpenseComments).mockImplementation(async ({ sort }) => ({
      items: [
        fxExpenseComment({
          id: '770e8400-e29b-41d4-a716-446655440070',
          message: sort === 'desc' ? 'DESC' : 'ASC',
        }),
      ],
      nextCursor: null,
    }));

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result, rerender } = renderHook(
      ({ sort }: { sort: 'asc' | 'desc' }) =>
        useExpenseCommentsInfinite({ groupId: gid, expenseId: eid, sort }),
      {
        wrapper: createWrapper(qc),
        initialProps: { sort: 'desc' as const },
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0]?.items[0]?.message).toBe('DESC');

    rerender({ sort: 'asc' });

    await waitFor(() => expect(result.current.data?.pages[0]?.items[0]?.message).toBe('ASC'));
    expect(listExpenseComments).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'asc', cursor: undefined }),
    );
  });

  it('resets queries after INVALID_EXPENSE_CURSOR then refetches', async () => {
    vi.mocked(listExpenseComments)
      .mockRejectedValueOnce(
        new ApiError({
          code: EXPENSE_COMMENT_SERVICE_CODES.INVALID_EXPENSE_CURSOR,
          message: 'bad',
          status: 400,
        }),
      )
      .mockResolvedValueOnce({ items: [], nextCursor: null });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(qc, 'resetQueries');

    const { result } = renderHook(
      () => useExpenseCommentsInfinite({ groupId: gid, expenseId: eid }),
      {
        wrapper: createWrapper(qc),
      },
    );

    await waitFor(() => expect(spy).toHaveBeenCalled());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages?.[0]?.items ?? []).toHaveLength(0);
  });
});
