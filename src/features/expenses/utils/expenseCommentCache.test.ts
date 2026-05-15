import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import {
  fxExpenseComment,
  FX_COMMENT_ID,
  FX_ROOT_ID,
} from '@/features/expenses/__tests__/expenseComment.fixtures';
import { expenseCommentsInfiniteQueryKey } from '@/features/expenses/expenseCommentsQueryKeys';
import { expensesQueryKeys } from '@/features/expenses/queryKeys';
import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';
import {
  insertCreatedExpenseCommentIntoInfiniteCache,
  mergeExpenseCommentInfinitePages,
  removeCommentAcrossExpenseCommentCaches,
  removeCommentFromDetailPreview,
  replaceCommentAcrossExpenseCommentCaches,
} from '@/features/expenses/utils/expenseCommentCache';

describe('expenseComment cache helpers', () => {
  const gid = '660e8400-e29b-41d4-a716-446655440010';
  const eid = '660e8400-e29b-41d4-a716-446655440011';

  it('insertCreatedExpenseCommentIntoInfiniteCache seeds cache when missing', () => {
    const qc = new QueryClient();
    const keyRoot = expenseCommentsInfiniteQueryKey(eid, undefined);
    const entry = fxExpenseComment({ id: '770e8400-e29b-41d4-a716-446655440020', message: 'root' });
    insertCreatedExpenseCommentIntoInfiniteCache(qc, keyRoot, entry, 'desc');
    const page = qc.getQueryData(keyRoot)?.pages?.[0];
    expect(page?.items.some((c) => c.id === entry.id)).toBe(true);
  });

  it('insertCreatedExpenseCommentIntoInfiniteCache prepends into page 0 when sort is desc', () => {
    const qc = new QueryClient();
    const keyRoot = expenseCommentsInfiniteQueryKey(eid, undefined);
    const existing = fxExpenseComment({
      id: '770e8400-e29b-41d4-a716-446655440099',
      message: 'older',
    });
    qc.setQueryData(keyRoot, {
      pages: [{ items: [existing], nextCursor: null }],
      pageParams: [undefined],
    });
    const entry = fxExpenseComment({
      id: '770e8400-e29b-41d4-a716-446655440021',
      message: 'newest',
    });
    insertCreatedExpenseCommentIntoInfiniteCache(qc, keyRoot, entry, 'desc');
    const page = qc.getQueryData(keyRoot)?.pages?.[0];
    expect(page?.items[0]?.id).toBe(entry.id);
    expect(page?.items[1]?.id).toBe(existing.id);
  });

  it('mergeExpenseCommentInfinitePages reverses desc API page order for display', () => {
    const a = fxExpenseComment({ id: '770e8400-e29b-41d4-a716-446655440020', message: 'new' });
    const b = fxExpenseComment({ id: '770e8400-e29b-41d4-a716-446655440021', message: 'old' });
    const merged = mergeExpenseCommentInfinitePages(
      [
        { items: [a, b] },
        {
          items: [
            fxExpenseComment({ id: '770e8400-e29b-41d4-a716-446655440022', message: 'older' }),
          ],
        },
      ],
      'desc',
    );
    expect(merged.map((c) => c.message)).toEqual(['older', 'old', 'new']);
  });

  it('replaceCommentAcrossExpenseCommentCaches updates matching ids across scopes', () => {
    const qc = new QueryClient();
    const rootKey = expenseCommentsInfiniteQueryKey(eid, undefined);
    const replyKey = expenseCommentsInfiniteQueryKey(eid, FX_ROOT_ID);
    const nested = fxExpenseComment({ id: FX_COMMENT_ID, parentCommentId: FX_ROOT_ID });
    qc.setQueryData(rootKey, {
      pages: [{ items: [fxExpenseComment({ id: FX_ROOT_ID })], nextCursor: null }],
      pageParams: [undefined],
    });
    qc.setQueryData(replyKey, {
      pages: [{ items: [nested], nextCursor: null }],
      pageParams: [undefined],
    });

    const edited = { ...nested, message: 'edited' };
    replaceCommentAcrossExpenseCommentCaches(qc, eid, edited);

    const replies = qc.getQueryData(replyKey)?.pages?.[0]?.items ?? [];
    expect(replies.find((c) => c.id === FX_COMMENT_ID)?.message).toBe('edited');
  });

  it('removeCommentAcrossExpenseCommentCaches strips ids from cached pages', () => {
    const qc = new QueryClient();
    const rootKey = expenseCommentsInfiniteQueryKey(eid, undefined);
    qc.setQueryData(rootKey, {
      pages: [
        {
          items: [fxExpenseComment({ id: FX_COMMENT_ID }), fxExpenseComment({ id: FX_ROOT_ID })],
          nextCursor: null,
        },
      ],
      pageParams: [undefined],
    });

    removeCommentAcrossExpenseCommentCaches(qc, eid, FX_COMMENT_ID);
    const items = qc.getQueryData(rootKey)?.pages?.flatMap((p) => p.items) ?? [];
    expect(items.some((c) => c.id === FX_COMMENT_ID)).toBe(false);
    expect(items.some((c) => c.id === FX_ROOT_ID)).toBe(true);
  });

  it('removeCommentFromDetailPreview removes preview rows by id', () => {
    const qc = new QueryClient();
    const stub = {
      groupId: gid,
      comments: [{ id: FX_COMMENT_ID, message: 'x' }],
    } as unknown as ExpenseDetail;

    qc.setQueryData(expensesQueryKeys.detail(gid, eid), stub);
    removeCommentFromDetailPreview(qc, gid, eid, FX_COMMENT_ID);

    const detail = qc.getQueryData(expensesQueryKeys.detail(gid, eid));
    const rows = detail?.comments ?? [];
    expect(rows.some((c) => typeof c.id === 'string' && c.id === FX_COMMENT_ID)).toBe(false);
  });
});
