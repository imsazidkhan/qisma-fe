import { describe, expect, it } from 'vitest';

import { EXPENSE_COMMENT_MESSAGE_MAX_LENGTH } from '@/features/expenses/constants/expenseComment';
import { deriveCommentComposerState } from '@/features/expenses/utils/commentComposerDerived';

describe('deriveCommentComposerState', () => {
  it('disables submit for whitespace-only drafts', () => {
    expect(deriveCommentComposerState('   \n').canSubmit).toBe(false);
  });

  it('enables submit for non-empty trimmed drafts within max length', () => {
    expect(deriveCommentComposerState(' ok ').canSubmit).toBe(true);
  });

  it('reports length for counter and blocks submit past max', () => {
    const long = 'a'.repeat(EXPENSE_COMMENT_MESSAGE_MAX_LENGTH + 1);
    const d = deriveCommentComposerState(long);
    expect(d.length).toBe(EXPENSE_COMMENT_MESSAGE_MAX_LENGTH + 1);
    expect(d.overMax).toBe(true);
    expect(d.canSubmit).toBe(false);
  });
});
