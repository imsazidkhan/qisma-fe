import { useQuery } from '@tanstack/react-query';

import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import {
  USER_SEARCH_QUERY_MAX,
  USER_SEARCH_QUERY_MIN,
  searchUsersDirectory,
} from '@/features/groups/api/usersSearchApi';
import { usersQueryKeys } from '@/features/groups/queryKeys';

/**
 * `GET /v1/users/search?q=` — enabled when `active` is true and query length is in **2–96** (trimmed).
 */
export function useUserDirectorySearch(query: string, active: boolean) {
  const { accessToken } = useAuthSession();
  const q = query.trim();
  const lenOk = q.length >= USER_SEARCH_QUERY_MIN && q.length <= USER_SEARCH_QUERY_MAX;

  return useQuery({
    queryKey: usersQueryKeys.search(q),
    queryFn: ({ signal }) => searchUsersDirectory(q, signal),
    enabled: Boolean(accessToken) && active && lenOk,
    staleTime: 20_000,
  });
}
