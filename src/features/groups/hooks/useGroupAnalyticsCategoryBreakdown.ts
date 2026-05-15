import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { fetchGroupAnalyticsCategoryBreakdown } from '@/features/groups/api/groupAnalyticsApi';
import { groupsQueryKeys } from '@/features/groups/queryKeys';
import type { GroupAnalyticsQuery } from '@/features/groups/types/groupAnalytics.types';
import { isUuid } from '@/features/groups/utils/isUuid';

function stableAnalyticsQueryKey(q: GroupAnalyticsQuery): string {
  const parts = [q.dateFrom ?? '', q.dateTo ?? '', q.scopedUserId ?? ''];
  return parts.join('|');
}

export function useGroupAnalyticsCategoryBreakdown(
  groupId: string | undefined,
  query: GroupAnalyticsQuery,
  options?: { enabled?: boolean },
) {
  const qk = useMemo(() => stableAnalyticsQueryKey(query), [query]);
  const baseEnabled = (options?.enabled ?? true) && Boolean(groupId && isUuid(groupId));
  const gid = groupId ?? '__none__';

  return useQuery({
    queryKey: groupsQueryKeys.analyticsSegment(gid, 'category-breakdown', qk),
    queryFn: ({ signal }) => fetchGroupAnalyticsCategoryBreakdown(groupId!, query, signal),
    enabled: baseEnabled,
  });
}
