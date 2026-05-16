import { describe, expect, it } from 'vitest';

import type { ExpenseSplitPayload } from '@/features/expenses/types/expense.types';
import { toVeloraqExpenseSplitWire } from '@/features/expenses/utils/expenseSplitVeloraqWire';

describe('toVeloraqExpenseSplitWire', () => {
  it('maps exact lines to amountsByUserId', () => {
    const split: ExpenseSplitPayload = {
      type: 'exact',
      lines: [
        { participantUserIds: ['a'], amount: '10.00' },
        { participantUserIds: ['b'], amount: '20.50' },
      ],
    };
    expect(toVeloraqExpenseSplitWire(split)).toEqual({
      splitType: 'exact',
      amountsByUserId: { a: '10.00', b: '20.50' },
    });
  });

  it('maps adjustment to fixedAmountsByUserId and remainderUserIds', () => {
    const split: ExpenseSplitPayload = {
      type: 'adjust',
      remainderUserId: 'c',
      lines: [
        { participantUserIds: ['a'], amount: '2500.00' },
        { participantUserIds: ['b'], amount: '2500.00' },
        { participantUserIds: ['c'], amount: '13500.00' },
      ],
    };
    expect(toVeloraqExpenseSplitWire(split)).toEqual({
      splitType: 'adjustment',
      fixedAmountsByUserId: { a: '2500.00', b: '2500.00' },
      remainderUserIds: ['c'],
    });
  });

  it('stringifies percentage and shares maps', () => {
    expect(
      toVeloraqExpenseSplitWire({
        type: 'percentage',
        lines: [
          { participantUserIds: ['a'], percent: 40 },
          { participantUserIds: ['b'], percent: 35.5 },
        ],
      }),
    ).toEqual({
      splitType: 'percentage',
      percentageByUserId: { a: '40', b: '35.5' },
    });

    expect(
      toVeloraqExpenseSplitWire({
        type: 'shares',
        lines: [
          { participantUserIds: ['a'], shares: 2 },
          { participantUserIds: ['b'], shares: 1 },
        ],
      }),
    ).toEqual({
      splitType: 'shares',
      sharesByUserId: { a: '2', b: '1' },
    });
  });
});
