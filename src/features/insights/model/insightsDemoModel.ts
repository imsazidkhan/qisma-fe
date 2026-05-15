export type InsightsTimeFilterId = 'this_month' | 'last_month' | 'three_months';

export type InsightsTrendPoint = { xLabel: string; amountMinor: number };

export type InsightsCategorySlice = {
  id: string;
  translationKey: string;
  amountMinor: number;
  share: number;
  /** Display order — first is “dominant” headline */
  order: number;
};

export type InsightsMemberBar = {
  id: string;
  displayName: string;
  letter: string;
  amountMinor: number;
  barShare: number;
  roleTranslationKey: string;
};

export type InsightsSmartLine = {
  id: string;
  translationKey: string;
  translationParams?: Record<string, string>;
};

export type InsightsDemoSnapshot = {
  totalSpentMinor: number;
  deltaVsPriorPct: number;
  trendUp: boolean;
  trend: InsightsTrendPoint[];
  categories: InsightsCategorySlice[];
  dominantCategoryId: string;
  groupBars: InsightsMemberBar[];
  smartLines: InsightsSmartLine[];
  wrappedMonthKey: string;
};

const CAT = {
  finance: 'insights.categories.finance',
  travel: 'insights.categories.travel',
  shopping: 'insights.categories.shopping',
  entertainment: 'insights.categories.entertainment',
  food: 'insights.categories.food',
  uncategorized: 'insights.categories.uncategorized',
} as const;

function daysSeries(base: number, variance: number, count: number): InsightsTrendPoint[] {
  const out: InsightsTrendPoint[] = [];
  for (let i = 0; i < count; i += 1) {
    const wiggle = Math.sin(i * 0.45) * variance + ((i % 5) * variance) / 3;
    out.push({
      xLabel: `${i + 1}`,
      amountMinor: Math.max(0, Math.round(base + wiggle)),
    });
  }
  return out;
}

export const INSIGHTS_DEMO_BY_FILTER: Record<InsightsTimeFilterId, InsightsDemoSnapshot> = {
  this_month: {
    totalSpentMinor: 1_842_000,
    deltaVsPriorPct: 12,
    trendUp: true,
    trend: daysSeries(42_000, 18_000, 28),
    dominantCategoryId: 'finance',
    categories: [
      {
        id: 'finance',
        translationKey: CAT.finance,
        amountMinor: 645_200,
        share: 0.35,
        order: 0,
      },
      { id: 'travel', translationKey: CAT.travel, amountMinor: 423_660, share: 0.23, order: 1 },
      { id: 'shopping', translationKey: CAT.shopping, amountMinor: 349_980, share: 0.19, order: 2 },
      {
        id: 'entertainment',
        translationKey: CAT.entertainment,
        amountMinor: 276_300,
        share: 0.15,
        order: 3,
      },
      {
        id: 'uncategorized',
        translationKey: CAT.uncategorized,
        amountMinor: 146_860,
        share: 0.08,
        order: 4,
      },
    ],
    groupBars: [
      {
        id: '1',
        displayName: 'Alex',
        letter: 'A',
        amountMinor: 612_000,
        barShare: 0.92,
        roleTranslationKey: 'insights.group.paidMost',
      },
      {
        id: '4',
        displayName: 'Rahul',
        letter: 'R',
        amountMinor: 348_000,
        barShare: 0.55,
        roleTranslationKey: 'insights.group.owesMost',
      },
      {
        id: '2',
        displayName: 'Sarah',
        letter: 'S',
        amountMinor: 498_000,
        barShare: 0.78,
        roleTranslationKey: 'insights.group.topContributor',
      },
      {
        id: '3',
        displayName: 'You',
        letter: 'Y',
        amountMinor: 384_000,
        barShare: 0.6,
        roleTranslationKey: 'insights.group.you',
      },
    ],
    smartLines: [
      { id: 's1', translationKey: 'insights.smart.weekend', translationParams: { pct: '32' } },
      { id: 's2', translationKey: 'insights.smart.topCategory' },
      { id: 's3', translationKey: 'insights.smart.rahul' },
      { id: 's4', translationKey: 'insights.smart.saved', translationParams: { amount: '₹2,000' } },
    ],
    wrappedMonthKey: 'insights.wrapped.monthMay',
  },
  last_month: {
    totalSpentMinor: 1_645_800,
    deltaVsPriorPct: -4,
    trendUp: false,
    trend: daysSeries(38_000, 22_000, 30).map((p, i) =>
      i % 6 === 0 ? { ...p, amountMinor: p.amountMinor + 25_000 } : p,
    ),
    dominantCategoryId: 'travel',
    categories: [
      { id: 'travel', translationKey: CAT.travel, amountMinor: 523_400, share: 0.32, order: 0 },
      { id: 'food', translationKey: CAT.food, amountMinor: 411_450, share: 0.25, order: 1 },
      { id: 'bills', translationKey: CAT.finance, amountMinor: 345_600, share: 0.21, order: 2 },
      { id: 'shopping', translationKey: CAT.shopping, amountMinor: 230_410, share: 0.14, order: 3 },
      {
        id: 'entertainment',
        translationKey: CAT.entertainment,
        amountMinor: 134_940,
        share: 0.08,
        order: 4,
      },
    ],
    groupBars: [
      {
        id: '1',
        displayName: 'Sarah',
        letter: 'S',
        amountMinor: 540_000,
        barShare: 0.88,
        roleTranslationKey: 'insights.group.paidMost',
      },
      {
        id: '2',
        displayName: 'You',
        letter: 'Y',
        amountMinor: 420_000,
        barShare: 0.72,
        roleTranslationKey: 'insights.group.topContributor',
      },
      {
        id: '3',
        displayName: 'Rahul',
        letter: 'R',
        amountMinor: 390_000,
        barShare: 0.65,
        roleTranslationKey: 'insights.group.owesMost',
      },
      {
        id: '4',
        displayName: 'Alex',
        letter: 'A',
        amountMinor: 295_800,
        barShare: 0.48,
        roleTranslationKey: 'insights.group.quietMonth',
      },
    ],
    smartLines: [
      { id: 's1', translationKey: 'insights.smart.travelSpike' },
      { id: 's2', translationKey: 'insights.smart.quietWeekends' },
      { id: 's3', translationKey: 'insights.smart.splitQuality' },
    ],
    wrappedMonthKey: 'insights.wrapped.monthApril',
  },
  three_months: {
    totalSpentMinor: 5_291_200,
    deltaVsPriorPct: 7,
    trendUp: true,
    trend: daysSeries(55_000, 35_000, 24),
    dominantCategoryId: 'food',
    categories: [
      { id: 'food', translationKey: CAT.food, amountMinor: 1_905_800, share: 0.36, order: 0 },
      {
        id: 'shopping',
        translationKey: CAT.shopping,
        amountMinor: 1_217_380,
        share: 0.23,
        order: 1,
      },
      { id: 'travel', translationKey: CAT.travel, amountMinor: 1_058_240, share: 0.2, order: 2 },
      { id: 'bills', translationKey: CAT.finance, amountMinor: 688_660, share: 0.13, order: 3 },
      {
        id: 'entertainment',
        translationKey: CAT.entertainment,
        amountMinor: 421_120,
        share: 0.08,
        order: 4,
      },
    ],
    groupBars: [
      {
        id: '1',
        displayName: 'Alex',
        letter: 'A',
        amountMinor: 1_120_000,
        barShare: 1,
        roleTranslationKey: 'insights.group.paidMost',
      },
      {
        id: '2',
        displayName: 'You',
        letter: 'Y',
        amountMinor: 980_000,
        barShare: 0.88,
        roleTranslationKey: 'insights.group.topContributor',
      },
      {
        id: '3',
        displayName: 'Sarah',
        letter: 'S',
        amountMinor: 910_000,
        barShare: 0.82,
        roleTranslationKey: 'insights.group.steady',
      },
      {
        id: '4',
        displayName: 'Rahul',
        letter: 'R',
        amountMinor: 640_000,
        barShare: 0.58,
        roleTranslationKey: 'insights.group.owesMost',
      },
    ],
    smartLines: [
      { id: 's1', translationKey: 'insights.smart.quarterFood' },
      { id: 's2', translationKey: 'insights.smart.sharedGoals' },
      { id: 's3', translationKey: 'insights.smart.augustCompare', translationParams: { pct: '7' } },
    ],
    wrappedMonthKey: 'insights.wrapped.quarter',
  },
};
