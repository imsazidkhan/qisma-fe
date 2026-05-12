import { Redirect, useLocalSearchParams } from 'expo-router';
import type { ReactElement } from 'react';

import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { isUuid } from '@/features/groups/utils/isUuid';

function resolvedParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] ?? '';
  return '';
}

/**
 * Phase E — `groups/:groupId/invite` deep link (e.g. `qisma://groups/<uuid>/invite`; prod may use a branded scheme/host).
 * For now: signed-in users land on invite-safe group preview (`roster=0`). Replace with a dedicated screen when backend/notifications ship.
 */
export default function GroupInviteDeepLinkRoute(): ReactElement {
  const { groupId: raw } = useLocalSearchParams<{ groupId: string | string[] }>();
  const groupId = resolvedParam(raw);
  const { isAuthenticated } = useAuthSession();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }
  if (!isUuid(groupId)) {
    return <Redirect href="/home" />;
  }
  return <Redirect href={`/home/group/${groupId}?roster=0`} />;
}
