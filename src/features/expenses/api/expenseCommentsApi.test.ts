/* eslint-disable import/first -- mock `apiFetch` before importing the API module under test. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ENDPOINTS } from '@/api/endpoints';
import {
  fxExpenseComment,
  FX_COMMENT_ID,
  FX_ROOT_ID,
} from '@/features/expenses/__tests__/expenseComment.fixtures';

const mockApiFetch = vi.hoisted(() => vi.fn());

vi.mock('@/api/apiFetch', () => ({
  apiFetch: mockApiFetch,
}));

import {
  createExpenseComment,
  deleteExpenseComment,
  listExpenseComments,
  patchExpenseComment,
} from '@/features/expenses/api/expenseCommentsApi';

describe('expenseCommentsApi', () => {
  const gid = '660e8400-e29b-41d4-a716-446655440010';
  const eid = '660e8400-e29b-41d4-a716-446655440011';

  beforeEach(() => {
    vi.mocked(mockApiFetch).mockReset();
  });

  it('listExpenseComments builds query string and returns parsed page', async () => {
    const row = fxExpenseComment({ parentCommentId: null });
    vi.mocked(mockApiFetch).mockResolvedValue({
      items: [
        {
          id: row.id,
          userId: row.userId,
          message: row.message,
          parentCommentId: null,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          user: row.user,
        },
      ],
      nextCursor: 'opaque-next',
    });

    const out = await listExpenseComments({
      groupId: gid,
      expenseId: eid,
      cursor: 'opaque-c',
      limit: 50,
      parentCommentId: FX_ROOT_ID,
    });

    expect(out.items).toHaveLength(1);
    expect(out.nextCursor).toBe('opaque-next');
    const url = String(vi.mocked(mockApiFetch).mock.calls[0]?.[0] ?? '');
    expect(url.startsWith(ENDPOINTS.expenses.groupExpenseComments(gid, eid))).toBe(true);
    expect(url).toContain('cursor=opaque-c');
    expect(url).toContain('limit=50');
    expect(url).toContain('sort=desc');
    expect(url).toContain(`parentCommentId=${encodeURIComponent(FX_ROOT_ID)}`);
  });

  it('createExpenseComment posts JSON body with optional parentCommentId', async () => {
    const row = fxExpenseComment({ parentCommentId: FX_ROOT_ID });
    vi.mocked(mockApiFetch).mockResolvedValue({
      id: row.id,
      userId: row.userId,
      message: row.message,
      parentCommentId: FX_ROOT_ID,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: row.user,
    });

    await createExpenseComment(gid, eid, { message: ' Hi ', parentCommentId: FX_ROOT_ID });

    expect(mockApiFetch).toHaveBeenCalledWith(ENDPOINTS.expenses.groupExpenseComments(gid, eid), {
      method: 'POST',
      body: { message: 'Hi', parentCommentId: FX_ROOT_ID },
      signal: undefined,
    });
  });

  it('patchExpenseComment targets comment-scoped path', async () => {
    const row = fxExpenseComment({ message: 'next' });
    vi.mocked(mockApiFetch).mockResolvedValue({
      id: row.id,
      userId: row.userId,
      message: row.message,
      parentCommentId: null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: row.user,
    });

    await patchExpenseComment(gid, eid, FX_COMMENT_ID, { message: 'patched' });

    expect(mockApiFetch).toHaveBeenCalledWith(
      ENDPOINTS.expenses.groupExpenseComment(gid, eid, FX_COMMENT_ID),
      {
        method: 'PATCH',
        body: { message: 'patched' },
        signal: undefined,
      },
    );
  });

  it('deleteExpenseComment parses envelope data', async () => {
    vi.mocked(mockApiFetch).mockResolvedValue({
      commentId: FX_COMMENT_ID,
      deletedAt: '2021-01-01T00:00:00.000Z',
    });

    const out = await deleteExpenseComment(gid, eid, FX_COMMENT_ID);

    expect(out).toEqual({
      commentId: FX_COMMENT_ID,
      deletedAt: '2021-01-01T00:00:00.000Z',
    });
    expect(mockApiFetch).toHaveBeenCalledWith(
      ENDPOINTS.expenses.groupExpenseComment(gid, eid, FX_COMMENT_ID),
      { method: 'DELETE', signal: undefined },
    );
  });
});
