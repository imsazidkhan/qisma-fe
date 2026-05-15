import type { QueryClient } from '@tanstack/react-query';

import { groupsQueryKeys } from '@/features/groups/queryKeys';
import { useInvitesInboxReloadStore } from '@/features/invites/store/useInvitesInboxReloadStore';

let queryClientRef: QueryClient | null = null;

export function registerSessionQueryRevalidationClient(client: QueryClient | null): void {
  queryClientRef = client;
}

/**
 * After a new access JWT is stored (OTP verify, cold-start refresh, 401 refresh):
 * refetch invites inbox and “my groups” so badges and home stay aligned with the server.
 */
export function notifySessionTokensRefreshed(): void {
  useInvitesInboxReloadStore.getState().bumpInvitesInboxReload();
  void queryClientRef?.invalidateQueries({ queryKey: groupsQueryKeys.myGroups });
}
