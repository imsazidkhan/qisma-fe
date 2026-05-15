import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';

import { fxExpenseComment } from '@/features/expenses/__tests__/expenseComment.fixtures';

import {
  buildExpenseCommentThreadRows,
  expenseCommentThreadRowToDayLabel,
  expenseCommentLocalDayKey,
  formatExpenseCommentThreadDayLabel,
  formatExpenseCommentThreadTime,
  parseExpenseCommentInstant,
} from './expenseCommentThreadLayout';

const tThread = ((key: string) => key) as TFunction;

describe('parseExpenseCommentInstant', () => {
  it('returns null when unparseable', () => {
    expect(parseExpenseCommentInstant('')).toBeNull();
    expect(parseExpenseCommentInstant('not-a-date')).toBeNull();
  });

  it('parses ISO strings', () => {
    expect(parseExpenseCommentInstant('2026-05-13T10:00:00.000Z')).toBeInstanceOf(Date);
  });
});

describe('expenseCommentLocalDayKey', () => {
  it('uses local calendar fields', () => {
    expect(expenseCommentLocalDayKey(new Date(2026, 4, 13, 23, 1))).toBe('2026-05-13');
  });
});

describe('formatExpenseCommentThreadDayLabel', () => {
  const noonMay13 = new Date(2026, 4, 13, 12, 0, 0);

  it('maps same local day to today key', () => {
    expect(formatExpenseCommentThreadDayLabel('2026-05-13T08:30:00', tThread, noonMay13)).toBe(
      'expenses.thread.dayToday',
    );
  });

  it('maps previous local day to yesterday key', () => {
    expect(formatExpenseCommentThreadDayLabel('2026-05-12T18:00:00', tThread, noonMay13)).toBe(
      'expenses.thread.dayYesterday',
    );
  });

  it('returns unknown for bad timestamps', () => {
    expect(formatExpenseCommentThreadDayLabel('x', tThread, noonMay13)).toBe(
      'expenses.thread.dayUnknown',
    );
  });
});

describe('expenseCommentThreadRowToDayLabel', () => {
  const noonMay13 = new Date(2026, 4, 13, 12, 0, 0);

  it('uses divider label for dayDivider rows', () => {
    const row = { kind: 'dayDivider' as const, dayKey: '2026-05-13', label: 'Custom' };
    expect(expenseCommentThreadRowToDayLabel(row, tThread, noonMay13)).toBe('Custom');
  });

  it('formats message rows from createdAt', () => {
    const row = {
      kind: 'message' as const,
      entry: fxExpenseComment({ createdAt: '2026-05-13T08:30:00', message: 'm' }),
    };
    expect(expenseCommentThreadRowToDayLabel(row, tThread, noonMay13)).toBe(
      'expenses.thread.dayToday',
    );
  });
});

describe('formatExpenseCommentThreadTime', () => {
  it('returns em dash when unparseable', () => {
    expect(formatExpenseCommentThreadTime('')).toBe('—');
  });
});

describe('buildExpenseCommentThreadRows', () => {
  const anchor = new Date(2026, 4, 13, 12, 0, 0);

  it('inserts one divider per local day', () => {
    const c = fxExpenseComment({
      id: '770e8400-e29b-41d4-a716-446655440001',
      createdAt: '2026-05-12T18:00:00',
      message: 'c',
    });
    const a = fxExpenseComment({
      id: '770e8400-e29b-41d4-a716-446655440002',
      createdAt: '2026-05-13T08:00:00',
      message: 'a',
    });
    const b = fxExpenseComment({
      id: '770e8400-e29b-41d4-a716-446655440003',
      createdAt: '2026-05-13T09:00:00',
      message: 'b',
    });

    const rows = buildExpenseCommentThreadRows([c, a, b], tThread, anchor);
    expect(rows.map((r) => r.kind)).toEqual([
      'dayDivider',
      'message',
      'dayDivider',
      'message',
      'message',
    ]);
    expect(rows.filter((r) => r.kind === 'message')).toHaveLength(3);
    const dividers = rows.filter((r) => r.kind === 'dayDivider');
    expect(new Set(dividers.map((d) => d.dayKey)).size).toBe(2);
  });
});
