import { describe, expect, it } from 'vitest';

import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';

import { shouldShowNonEvenSplitOverviewContext } from '@/features/expenses/utils/expenseDetailSplitInsight';

function detailWith(
  overrides: Record<string, unknown> & { splitType?: string; participants?: unknown[] },
): ExpenseDetail {
  const { splitType, participants = [{ id: 'p1' }], ...rest } = overrides;
  return {
    id: 'exp-1',
    groupId: 'grp-1',
    title: 'Coffee',
    amount: '90',
    currency: 'USD',
    date: '2026-05-01',
    paidByUserId: 'user-1',
    participants: participants as ExpenseDetail['participants'],
    comments: [],
    reactions: [],
    attachments: [],
    history: [],
    ...(splitType !== undefined ? { splitType } : {}),
    ...rest,
  } as ExpenseDetail;
}

describe('shouldShowNonEvenSplitOverviewContext', () => {
  it('is false when there are no participants', () => {
    expect(
      shouldShowNonEvenSplitOverviewContext(
        detailWith({ splitType: 'custom', participants: [] }),
        0,
      ),
    ).toBe(false);
  });

  it('is false for equal split', () => {
    expect(shouldShowNonEvenSplitOverviewContext(detailWith({ splitType: 'equal' }), 2)).toBe(
      false,
    );
  });

  it('is false when split type is missing or empty', () => {
    expect(shouldShowNonEvenSplitOverviewContext(detailWith({ splitType: '' }), 2)).toBe(false);
    expect(shouldShowNonEvenSplitOverviewContext(detailWith({}), 2)).toBe(false);
  });

  it('is true for non-equal split with participants', () => {
    expect(shouldShowNonEvenSplitOverviewContext(detailWith({ splitType: 'custom' }), 2)).toBe(
      true,
    );
    expect(shouldShowNonEvenSplitOverviewContext(detailWith({ splitType: 'percent' }), 1)).toBe(
      true,
    );
  });
});
