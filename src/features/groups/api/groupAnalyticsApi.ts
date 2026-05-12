import { apiFetch, ENDPOINTS } from '@/api';
import type {
  CategoryBreakdownRow,
  GroupAnalyticsQuery,
  HeatmapCell,
  MerchantInsightRow,
  MonthlyTrendRow,
  RecurringInsight,
  TopSpenderRow,
} from '@/features/groups/types/groupAnalytics.types';
import {
  parseCategoryBreakdownRows,
  parseHeatmapCells,
  parseMerchantInsightRows,
  parseMonthlyTrendRows,
  parseRecurringInsight,
  parseTopSpenderRows,
} from '@/features/groups/types/groupAnalytics.types';

function appendIfDefined(search: URLSearchParams, key: string, value: string | undefined): void {
  if (value === undefined) return;
  const s = value.trim();
  if (s === '') return;
  search.set(key, s);
}

export function buildGroupAnalyticsSearchParams(query: GroupAnalyticsQuery): string {
  const search = new URLSearchParams();
  appendIfDefined(search, 'dateFrom', query.dateFrom);
  appendIfDefined(search, 'dateTo', query.dateTo);
  appendIfDefined(search, 'scopedUserId', query.scopedUserId);
  return search.toString();
}

export async function fetchGroupAnalyticsCategoryBreakdown(
  groupId: string,
  query: GroupAnalyticsQuery,
  signal?: AbortSignal,
): Promise<CategoryBreakdownRow[]> {
  const qs = buildGroupAnalyticsSearchParams(query);
  const path = `${ENDPOINTS.groups.analyticsCategoryBreakdown(groupId)}${qs ? `?${qs}` : ''}`;
  const raw = await apiFetch<unknown>(path, { method: 'GET', signal });
  return parseCategoryBreakdownRows(raw);
}

export async function fetchGroupAnalyticsMonthlyTrends(
  groupId: string,
  query: GroupAnalyticsQuery,
  signal?: AbortSignal,
): Promise<MonthlyTrendRow[]> {
  const qs = buildGroupAnalyticsSearchParams(query);
  const path = `${ENDPOINTS.groups.analyticsMonthlyTrends(groupId)}${qs ? `?${qs}` : ''}`;
  const raw = await apiFetch<unknown>(path, { method: 'GET', signal });
  return parseMonthlyTrendRows(raw);
}

export async function fetchGroupAnalyticsTopSpenders(
  groupId: string,
  query: GroupAnalyticsQuery,
  signal?: AbortSignal,
): Promise<TopSpenderRow[]> {
  const qs = buildGroupAnalyticsSearchParams(query);
  const path = `${ENDPOINTS.groups.analyticsTopSpenders(groupId)}${qs ? `?${qs}` : ''}`;
  const raw = await apiFetch<unknown>(path, { method: 'GET', signal });
  return parseTopSpenderRows(raw);
}

export async function fetchGroupAnalyticsMerchants(
  groupId: string,
  query: GroupAnalyticsQuery,
  signal?: AbortSignal,
): Promise<MerchantInsightRow[]> {
  const qs = buildGroupAnalyticsSearchParams(query);
  const path = `${ENDPOINTS.groups.analyticsMerchants(groupId)}${qs ? `?${qs}` : ''}`;
  const raw = await apiFetch<unknown>(path, { method: 'GET', signal });
  return parseMerchantInsightRows(raw);
}

export async function fetchGroupAnalyticsHeatmap(
  groupId: string,
  query: GroupAnalyticsQuery,
  signal?: AbortSignal,
): Promise<HeatmapCell[]> {
  const qs = buildGroupAnalyticsSearchParams(query);
  const path = `${ENDPOINTS.groups.analyticsHeatmap(groupId)}${qs ? `?${qs}` : ''}`;
  const raw = await apiFetch<unknown>(path, { method: 'GET', signal });
  return parseHeatmapCells(raw);
}

export async function fetchGroupAnalyticsRecurring(
  groupId: string,
  query: GroupAnalyticsQuery,
  signal?: AbortSignal,
): Promise<RecurringInsight | null> {
  const qs = buildGroupAnalyticsSearchParams(query);
  const path = `${ENDPOINTS.groups.analyticsRecurring(groupId)}${qs ? `?${qs}` : ''}`;
  const raw = await apiFetch<unknown>(path, { method: 'GET', signal });
  return parseRecurringInsight(raw);
}
