import { describe, expect, it } from 'vitest';

import type {
  CategoryBreakdownRow,
  MonthlyTrendRow,
} from '@/features/groups/types/groupAnalytics.types';
import {
  buildGroupQuickStats,
  categoryBreakdownToDonutSlices,
  monthOverMonthDeltaPct,
  monthlyTrendsToBuckets,
  monthlyTrendsToSparkPoints,
  parseAnalyticsAmountMajor,
  sumCategoryBreakdownMajor,
} from '@/features/groups/utils/groupAnalyticsDerived';

function cat(
  partial: Partial<CategoryBreakdownRow> & Pick<CategoryBreakdownRow, 'categorySlug'>,
): CategoryBreakdownRow {
  return {
    categorySlug: partial.categorySlug,
    totalAmount: partial.totalAmount ?? '0',
    expenseCount: partial.expenseCount ?? 0,
    ...(partial.categoryId !== undefined ? { categoryId: partial.categoryId } : {}),
  };
}

describe('groupAnalyticsDerived', () => {
  it('sums category breakdown', () => {
    const rows = [
      cat({ categorySlug: 'a', totalAmount: '10' }),
      cat({ categorySlug: 'b', totalAmount: '20.5' }),
    ];
    expect(sumCategoryBreakdownMajor(rows)).toBeCloseTo(30.5, 5);
  });

  it('builds donut shares', () => {
    const rows = [
      cat({ categorySlug: 'food', totalAmount: '75' }),
      cat({ categorySlug: 'travel', totalAmount: '25' }),
    ];
    const slices = categoryBreakdownToDonutSlices(rows);
    expect(slices).toHaveLength(2);
    expect(slices[0]!.share).toBeCloseTo(0.75, 5);
    expect(slices[1]!.share).toBeCloseTo(0.25, 5);
  });

  it('monthlyTrendsToSparkPoints sorts chronologically', () => {
    const rows: MonthlyTrendRow[] = [
      { year: 2024, month: 3, totalAmount: '100', expenseCount: 1 },
      { year: 2024, month: 1, totalAmount: '50', expenseCount: 1 },
    ];
    const pts = monthlyTrendsToSparkPoints(rows);
    expect(pts[0]!.amountMinor).toBe(5000);
    expect(pts[1]!.amountMinor).toBe(10000);
  });

  it('monthOverMonthDeltaPct', () => {
    const rows: MonthlyTrendRow[] = [
      { year: 2024, month: 1, totalAmount: '100', expenseCount: 1 },
      { year: 2024, month: 2, totalAmount: '120', expenseCount: 1 },
    ];
    const d = monthOverMonthDeltaPct(rows);
    expect(d?.trendUp).toBe(true);
    expect(d?.deltaPct).toBe(20);
  });

  it('monthOverMonthDeltaPct one decimal', () => {
    const rows: MonthlyTrendRow[] = [
      { year: 2024, month: 1, totalAmount: '100', expenseCount: 1 },
      { year: 2024, month: 2, totalAmount: '114.5', expenseCount: 1 },
    ];
    const d = monthOverMonthDeltaPct(rows);
    expect(d?.trendUp).toBe(true);
    expect(d?.deltaPct).toBe(14.5);
  });

  it('monthlyTrendsToBuckets marks latest', () => {
    const rows: MonthlyTrendRow[] = [
      { year: 2024, month: 3, totalAmount: '50', expenseCount: 1 },
      { year: 2024, month: 1, totalAmount: '100', expenseCount: 1 },
    ];
    const b = monthlyTrendsToBuckets(rows);
    expect(b).toHaveLength(2);
    expect(b[0]?.labelShort).toBe('Jan');
    expect(b[1]?.isLatest).toBe(true);
  });

  it('buildGroupQuickStats from monthly trends', () => {
    const rows: MonthlyTrendRow[] = [
      { year: 2024, month: 1, totalAmount: '100', expenseCount: 1 },
      { year: 2024, month: 2, totalAmount: '300', expenseCount: 1 },
    ];
    const q = buildGroupQuickStats(rows, 4);
    expect(q?.highestAmountMajor).toBe(300);
    expect(q?.lowestAmountMajor).toBe(100);
    expect(q?.averageMajor).toBe(200);
    expect(q?.activePayerCount).toBe(4);
  });

  it('parseAnalyticsAmountMajor handles invalid', () => {
    expect(parseAnalyticsAmountMajor('x')).toBe(0);
  });
});
