import type { ExpenseCommentEntry } from '@/features/expenses/types/expenseComment.types';

export const FX_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
export const FX_COMMENT_ID = '550e8400-e29b-41d4-a716-446655440002';
export const FX_ROOT_ID = '550e8400-e29b-41d4-a716-446655440003';

export function fxExpenseComment(over?: Partial<ExpenseCommentEntry>): ExpenseCommentEntry {
  return {
    id: FX_COMMENT_ID,
    userId: FX_USER_ID,
    message: 'hello',
    parentCommentId: null,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    user: { id: FX_USER_ID, name: 'Sam', username: 'sam', avatar: null },
    ...over,
  };
}
