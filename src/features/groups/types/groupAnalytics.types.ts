import { z } from 'zod';

/** Shared query for `GET /v1/groups/:groupId/analytics/*`. */
export type GroupAnalyticsQuery = {
  dateFrom?: string;
  dateTo?: string;
  scopedUserId?: string;
};

const categoryBreakdownRowSchema = z
  .object({
    categoryId: z.union([z.string(), z.null()]).optional(),
    categorySlug: z.string(),
    totalAmount: z.string(),
    expenseCount: z.number().int().nonnegative(),
  })
  .passthrough();

export type CategoryBreakdownRow = z.infer<typeof categoryBreakdownRowSchema>;

const monthlyTrendRowSchema = z
  .object({
    year: z.number().int(),
    month: z.number().int(),
    totalAmount: z.string(),
    expenseCount: z.number().int().nonnegative(),
  })
  .passthrough();

export type MonthlyTrendRow = z.infer<typeof monthlyTrendRowSchema>;

const topSpenderRowSchema = z
  .object({
    userId: z.string(),
    totalPaidAmount: z.string(),
    expenseCount: z.number().int().nonnegative(),
  })
  .passthrough();

export type TopSpenderRow = z.infer<typeof topSpenderRowSchema>;

const merchantInsightRowSchema = z
  .object({
    merchantId: z.string(),
    displayName: z.string(),
    totalAmount: z.string(),
    expenseCount: z.number().int().nonnegative(),
  })
  .passthrough();

export type MerchantInsightRow = z.infer<typeof merchantInsightRowSchema>;

const heatmapCellSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    hour: z.number().int().min(0).max(23),
    totalAmount: z.string(),
    expenseCount: z.number().int().nonnegative(),
  })
  .passthrough();

export type HeatmapCell = z.infer<typeof heatmapCellSchema>;

const recurringInsightSchema = z
  .object({
    clusterCount: z.number().int().nonnegative(),
    flaggedExpenseCount: z.number().int().nonnegative(),
    avgConfidence: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();

export type RecurringInsight = z.infer<typeof recurringInsightSchema>;

export function parseCategoryBreakdownRows(data: unknown): CategoryBreakdownRow[] {
  if (!Array.isArray(data)) return [];
  const out: CategoryBreakdownRow[] = [];
  for (const row of data) {
    const p = categoryBreakdownRowSchema.safeParse(row);
    if (p.success) out.push(p.data);
  }
  return out;
}

export function parseMonthlyTrendRows(data: unknown): MonthlyTrendRow[] {
  if (!Array.isArray(data)) return [];
  const out: MonthlyTrendRow[] = [];
  for (const row of data) {
    const p = monthlyTrendRowSchema.safeParse(row);
    if (p.success) out.push(p.data);
  }
  return out;
}

export function parseTopSpenderRows(data: unknown): TopSpenderRow[] {
  if (!Array.isArray(data)) return [];
  const out: TopSpenderRow[] = [];
  for (const row of data) {
    const p = topSpenderRowSchema.safeParse(row);
    if (p.success) out.push(p.data);
  }
  return out;
}

export function parseMerchantInsightRows(data: unknown): MerchantInsightRow[] {
  if (!Array.isArray(data)) return [];
  const out: MerchantInsightRow[] = [];
  for (const row of data) {
    const p = merchantInsightRowSchema.safeParse(row);
    if (p.success) out.push(p.data);
  }
  return out;
}

export function parseHeatmapCells(data: unknown): HeatmapCell[] {
  if (!Array.isArray(data)) return [];
  const out: HeatmapCell[] = [];
  for (const row of data) {
    const p = heatmapCellSchema.safeParse(row);
    if (p.success) out.push(p.data);
  }
  return out;
}

export function parseRecurringInsight(data: unknown): RecurringInsight | null {
  const p = recurringInsightSchema.safeParse(data);
  return p.success ? p.data : null;
}
