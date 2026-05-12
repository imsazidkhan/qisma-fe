import { useQuery } from '@tanstack/react-query';

import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { getMyGroupsList } from '@/features/groups/api/groupsApi';
import { groupsQueryKeys } from '@/features/groups/queryKeys';
import type { GroupListItem } from '@/features/groups/types/groupsList.types';

/**
 * Signed-in **My groups** feed from **`GET /v1/users/me/groups`**.
 */
export function useGroupsList() {
  const { accessToken } = useAuthSession();

  return useQuery<GroupListItem[], Error>({
    queryKey: groupsQueryKeys.myGroups,
    queryFn: ({ signal }) => getMyGroupsList(signal),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  });
}
