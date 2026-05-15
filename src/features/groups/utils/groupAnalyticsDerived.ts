import type {
  CategoryBreakdownRow,
  HeatmapCell,
  MonthlyTrendRow,
  TopSpenderRow,
} from '@/features/groups/types/groupAnalytics.types';

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

function monthYearLabel(year: number, month: number): string {
  const m = MONTH_SHORT[month - 1] ?? '—';
  return `${m} ’${String(year).slice(2)}`;
}

export function parseAnalyticsAmountMajor(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export function sumCategoryBreakdownMajor(rows: readonly CategoryBreakdownRow[]): number {
  return rows.reduce((acc, r) => acc + parseAnalyticsAmountMajor(r.totalAmount), 0);
}

export type CategoryDonutSlice = {
  id: string;
  label: string;
  amountMajor: number;
  share: number;
};

export function humanizeCategorySlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function categoryBreakdownToDonutSlices(
  rows: readonly CategoryBreakdownRow[],
): CategoryDonutSlice[] {
  const total = sumCategoryBreakdownMajor(rows);
  if (total <= 0) return [];
  return rows
    .map((r) => {
      const amountMajor = parseAnalyticsAmountMajor(r.totalAmount);
      return {
        id: `${r.categorySlug}-${r.categoryId ?? 'none'}`,
        label: humanizeCategorySlug(r.categorySlug),
        amountMajor,
        share: amountMajor / total,
      };
    })
    .sort((a, b) => b.amountMajor - a.amountMajor);
}

export function monthlyTrendsToSparkPoints(
  rows: readonly MonthlyTrendRow[],
): { xLabel: string; amountMinor: number }[] {
  const sorted = [...rows].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
  return sorted.map((r) => ({
    xLabel: monthYearLabel(r.year, r.month),
    amountMinor: Math.max(0, Math.round(parseAnalyticsAmountMajor(r.totalAmount) * 100)),
  }));
}

export function monthOverMonthDeltaPct(
  rows: readonly MonthlyTrendRow[],
): { deltaPct: number; trendUp: boolean } | null {
  const sorted = [...rows].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
  if (sorted.length < 2) return null;
  const prev = parseAnalyticsAmountMajor(sorted[sorted.length - 2]!.totalAmount);
  const last = parseAnalyticsAmountMajor(sorted[sorted.length - 1]!.totalAmount);
  if (prev <= 0) {
    if (last > 0) return { deltaPct: 100, trendUp: true };
    return null;
  }
  const raw = ((last - prev) / prev) * 100;
  const deltaPct = Math.min(999, Math.round(Math.abs(raw) * 10) / 10);
  return { deltaPct, trendUp: raw >= 0 };
}

export type MonthlyBucket = {
  year: number;
  month: number;
  amountMajor: number;
  labelShort: string;
  labelFull: string;
  isLatest: boolean;
};

export function monthlyTrendsToBuckets(rows: readonly MonthlyTrendRow[]): MonthlyBucket[] {
  const sorted = [...rows].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
  if (sorted.length === 0) return [];
  const lastIdx = sorted.length - 1;
  return sorted.map((r, idx) => {
    const amountMajor = parseAnalyticsAmountMajor(r.totalAmount);
    const m = MONTH_SHORT[r.month - 1] ?? '—';
    return {
      year: r.year,
      month: r.month,
      amountMajor,
      labelShort: m,
      labelFull: `${m} ${r.year}`,
      isLatest: idx === lastIdx,
    };
  });
}

export type GroupQuickStats = {
  highestLabel: string;
  highestAmountMajor: number;
  lowestLabel: string;
  lowestAmountMajor: number;
  averageMajor: number;
  activePayerCount: number;
};

export function buildGroupQuickStats(
  rows: readonly MonthlyTrendRow[],
  activePayerCount: number,
): GroupQuickStats | null {
  const buckets = monthlyTrendsToBuckets(rows).filter((b) => b.amountMajor > 0);
  if (buckets.length === 0) return null;
  let hi = buckets[0]!;
  let lo = buckets[0]!;
  let sum = 0;
  for (const b of buckets) {
    sum += b.amountMajor;
    if (b.amountMajor > hi.amountMajor) hi = b;
    if (b.amountMajor < lo.amountMajor) lo = b;
  }
  const averageMajor = sum / buckets.length;
  return {
    highestLabel: hi.labelFull,
    highestAmountMajor: hi.amountMajor,
    lowestLabel: lo.labelFull,
    lowestAmountMajor: lo.amountMajor,
    averageMajor,
    activePayerCount: Math.max(0, activePayerCount),
  };
}

export function heatmapWeekendSpendRatio(cells: readonly HeatmapCell[]): number | null {
  if (cells.length === 0) return null;
  let weekend = 0;
  let total = 0;
  for (const c of cells) {
    const amt = parseAnalyticsAmountMajor(c.totalAmount);
    total += amt;
    if (c.dayOfWeek === 0 || c.dayOfWeek === 6) {
      weekend += amt;
    }
  }
  if (total <= 0) return null;
  return weekend / total;
}

export type SpenderBarRow = {
  id: string;
  label: string;
  letter: string;
  amountMajor: number;
  barShare: number;
  expenseCount: number;
};

export function topSpendersToBarRows(rows: readonly TopSpenderRow[]): SpenderBarRow[] {
  const parsed = rows.map((r) => ({
    row: r,
    amount: parseAnalyticsAmountMajor(r.totalPaidAmount),
  }));
  const max = Math.max(1, ...parsed.map((p) => p.amount));
  return parsed
    .map(({ row, amount }) => ({
      id: row.userId,
      label: row.userId.length > 10 ? `${row.userId.slice(0, 8)}…` : row.userId,
      letter: row.userId.trim().charAt(0).toUpperCase() || '?',
      amountMajor: amount,
      barShare: amount / max,
      expenseCount: row.expenseCount,
    }))
    .sort((a, b) => b.amountMajor - a.amountMajor);
}

export function formatGroupAnalyticsInr(major: number): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(major);
  } catch {
    return String(major);
  }
}
