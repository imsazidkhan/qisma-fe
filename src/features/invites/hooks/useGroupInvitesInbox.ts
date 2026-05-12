import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/api';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { getMyGroupInvites } from '@/features/invites/api/groupInvitesApi';
import { invitesQueryKeys } from '@/features/invites/queryKeys';
import { useInvitesInboxReloadStore } from '@/features/invites/store/useInvitesInboxReloadStore';
import type { GroupInviteInboxItem } from '@/features/invites/types/groupInviteInbox.types';

const POLL_MS = 60_000;

/**
 * Shared inbox query for tab badge + Invites screen.
 *
 * React Query dedupes by `queryKey`: tab bar and screen observers share one in-flight fetch.
 * `reloadToken` forces a new key after OTP verify; polling + pull-to-refresh + tab focus use the same key for coalescing.
 */
export function useGroupInvitesInbox() {
  const { accessToken } = useAuthSession();
  const reloadToken = useInvitesInboxReloadStore((s) => s.reloadToken);

  return useQuery<GroupInviteInboxItem[], Error>({
    queryKey: invitesQueryKeys.inbox(reloadToken),
    queryFn: ({ signal }) => getMyGroupInvites(signal),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
