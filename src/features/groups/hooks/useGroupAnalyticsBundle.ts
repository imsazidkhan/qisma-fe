import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';

import {
  fetchGroupAnalyticsCategoryBreakdown,
  fetchGroupAnalyticsHeatmap,
  fetchGroupAnalyticsMerchants,
  fetchGroupAnalyticsMonthlyTrends,
  fetchGroupAnalyticsRecurring,
  fetchGroupAnalyticsTopSpenders,
} from '@/features/groups/api/groupAnalyticsApi';
import { groupsQueryKeys } from '@/features/groups/queryKeys';
import type { GroupAnalyticsQuery } from '@/features/groups/types/groupAnalytics.types';
import { isUuid } from '@/features/groups/utils/isUuid';

function stableAnalyticsQueryKey(q: GroupAnalyticsQuery): string {
  const parts = [q.dateFrom ?? '', q.dateTo ?? '', q.scopedUserId ?? ''];
  return parts.join('|');
}

export function useGroupAnalyticsBundle(
  groupId: string | undefined,
  query: GroupAnalyticsQuery,
  options?: { enabled?: boolean },
) {
  const qk = useMemo(() => stableAnalyticsQueryKey(query), [query]);
  const baseEnabled = (options?.enabled ?? true) && Boolean(groupId && isUuid(groupId));

  const gid = groupId ?? '__none__';
  const results = useQueries({
    queries: [
      {
        queryKey: groupsQueryKeys.analyticsSegment(gid, 'category-breakdown', qk),
        queryFn: ({ signal }) => fetchGroupAnalyticsCategoryBreakdown(groupId!, query, signal),
        enabled: baseEnabled,
      },
      {
        queryKey: groupsQueryKeys.analyticsSegment(gid, 'monthly-trends', qk),
        queryFn: ({ signal }) => fetchGroupAnalyticsMonthlyTrends(groupId!, query, signal),
        enabled: baseEnabled,
      },
      {
        queryKey: groupsQueryKeys.analyticsSegment(gid, 'top-spenders', qk),
        queryFn: ({ signal }) => fetchGroupAnalyticsTopSpenders(groupId!, query, signal),
        enabled: baseEnabled,
      },
      {
        queryKey: groupsQueryKeys.analyticsSegment(gid, 'merchants', qk),
        queryFn: ({ signal }) => fetchGroupAnalyticsMerchants(groupId!, query, signal),
        enabled: baseEnabled,
      },
      {
        queryKey: groupsQueryKeys.analyticsSegment(gid, 'heatmap', qk),
        queryFn: ({ signal }) => fetchGroupAnalyticsHeatmap(groupId!, query, signal),
        enabled: baseEnabled,
      },
      {
        queryKey: groupsQueryKeys.analyticsSegment(gid, 'recurring', qk),
        queryFn: ({ signal }) => fetchGroupAnalyticsRecurring(groupId!, query, signal),
        enabled: baseEnabled,
      },
    ],
  });

  const isPending = results.some((r) => r.isPending);
  const isFetching = results.some((r) => r.isFetching);
  const isError = results.some((r) => r.isError);
  const refetchAll = (): void => {
    for (const r of results) {
      void r.refetch();
    }
  };

  return {
    categoryBreakdown: results[0]?.data ?? [],
    monthlyTrends: results[1]?.data ?? [],
    topSpenders: results[2]?.data ?? [],
    merchants: results[3]?.data ?? [],
    heatmap: results[4]?.data ?? [],
    recurring: results[5]?.data ?? null,
    isPending,
    isFetching,
    isError,
    refetchAll,
    queryResults: results,
  };
}
