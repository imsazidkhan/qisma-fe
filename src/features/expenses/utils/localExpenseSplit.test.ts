import { describe, expect, it } from 'vitest';

import {
  computeLocalSplitValidation,
  validateLocalSplitForm,
  type LocalSplitFormState,
} from '@/features/expenses/utils/localExpenseSplit';

function baseSplit(over: Partial<LocalSplitFormState> = {}): LocalSplitFormState {
  return {
    splitType: 'equal',
    participantUserIds: ['a', 'b'],
    totalAmountMajor: '10',
    currency: 'INR',
    exactByUserId: {},
    percentByUserId: {},
    sharesByUserId: {},
    adjustFixedByUserId: {},
    adjustRemainderUserId: null,
    ...over,
  };
}

describe('computeLocalSplitValidation', () => {
  it('percentage: empty rows with partial sum returns percent_partial and remaining', () => {
    const v = computeLocalSplitValidation(
      baseSplit({
        splitType: 'percentage',
        percentByUserId: { a: '40', b: '' },
      }),
    );
    expect(v).toEqual({ kind: 'percent_partial', sumAssigned: 40, remainingToHundred: 60 });
  });

  it('percentage: all filled under 100 returns percent_gap', () => {
    const v = computeLocalSplitValidation(
      baseSplit({
        splitType: 'percentage',
        percentByUserId: { a: '30', b: '40' },
      }),
    );
    expect(v).toEqual({ kind: 'percent_gap', gapPercent: 30 });
  });

  it('percentage: all filled at 100 is perfect', () => {
    const v = computeLocalSplitValidation(
      baseSplit({
        splitType: 'percentage',
        percentByUserId: { a: '60', b: '40' },
      }),
    );
    expect(v.kind).toBe('perfect');
  });

  it('percentage: rejects row over 100', () => {
    const v = computeLocalSplitValidation(
      baseSplit({
        splitType: 'percentage',
        percentByUserId: { a: '101', b: '0' },
      }),
    );
    expect(v).toEqual({
      kind: 'incomplete',
      labelKey: 'expenses.add.validation.percentRowExceeds100',
    });
  });

  it('percentage: rejects NaN input', () => {
    const v = computeLocalSplitValidation(
      baseSplit({
        splitType: 'percentage',
        percentByUserId: { a: '12.3.4', b: '10' },
      }),
    );
    expect(v.kind).toBe('incomplete');
  });

  it('percentage: filled rows exceed 100 with blanks still yields percent_over', () => {
    const v = computeLocalSplitValidation(
      baseSplit({
        splitType: 'percentage',
        participantUserIds: ['a', 'b', 'c'],
        percentByUserId: { a: '60', b: '50', c: '' },
      }),
    );
    expect(v).toEqual({ kind: 'percent_over', overBy: 10 });
  });

  it('percentage: sum 100 with empty row is partial', () => {
    const v = computeLocalSplitValidation(
      baseSplit({
        splitType: 'percentage',
        participantUserIds: ['a', 'b', 'c'],
        percentByUserId: { a: '50', b: '50', c: '' },
      }),
    );
    expect(v).toEqual({ kind: 'percent_partial', sumAssigned: 100, remainingToHundred: 0 });
  });

  it('shares: empty map is incomplete (each row must be filled)', () => {
    const v = computeLocalSplitValidation(
      baseSplit({
        splitType: 'shares',
        sharesByUserId: {},
      }),
    );
    expect(v.kind).toBe('incomplete');
  });

  it('still rejects explicit zero-share rows', () => {
    const v = computeLocalSplitValidation(
      baseSplit({
        splitType: 'shares',
        sharesByUserId: { a: 2, b: 0 },
      }),
    );
    expect(v.kind).toBe('incomplete');
  });
});

describe('validateLocalSplitForm', () => {
  it('rejects shares map missing a participant id', () => {
    const result = validateLocalSplitForm(
      baseSplit({
        splitType: 'shares',
        sharesByUserId: { a: 2 },
      }),
    );
    expect(result.ok).toBe(false);
  });

  it('emits share lines when every participant has a weight', () => {
    const result = validateLocalSplitForm(
      baseSplit({
        splitType: 'shares',
        sharesByUserId: { a: 2, b: 3 },
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    if (result.split.type !== 'shares') {
      throw new Error('expected shares split');
    }
    expect(result.split.lines).toEqual([
      { participantUserIds: ['a'], shares: 2 },
      { participantUserIds: ['b'], shares: 3 },
    ]);
  });
});
