import { describe, expect, it } from 'vitest';

import { canModerateExpenseCommentRow } from '@/features/expenses/utils/commentRowModeration';

describe('canModerateExpenseCommentRow', () => {
  it('returns false for other authors when not moderator', () => {
    expect(canModerateExpenseCommentRow('u1', 'u2', false)).toBe(false);
  });

  it('returns true for the author even when not moderator', () => {
    expect(canModerateExpenseCommentRow('u1', 'u1', false)).toBe(true);
  });

  it('returns true for moderators on other authors', () => {
    expect(canModerateExpenseCommentRow('u1', 'u2', true)).toBe(true);
  });
});
