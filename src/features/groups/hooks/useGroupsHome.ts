import { useQuery } from '@tanstack/react-query';

import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { getMyGroupsHome } from '@/features/groups/api/groupsApi';
import { groupsQueryKeys } from '@/features/groups/queryKeys';
import type { GroupsHomeData, GroupsHomeTabQuery } from '@/features/groups/types/groupHome.types';

/**
 * Tabbed **groups hub** from **`GET /v1/users/me/groups/home`** (`tab` aligns with filter chips).
 */
export function useGroupsHome(tab: GroupsHomeTabQuery) {
  const { accessToken } = useAuthSession();

  return useQuery<GroupsHomeData, Error>({
    queryKey: groupsQueryKeys.myGroupsHome(tab),
    queryFn: ({ signal }) => getMyGroupsHome(tab, signal),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
}
