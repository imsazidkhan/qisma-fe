import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, type ReactElement } from 'react';

import { GroupDetailRouteView } from '@/features/groups/components/GroupDetailRouteView';

function resolvedParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] ?? '';
  return '';
}

/** `?roster=0` — skip members roster fetch for pending invitees (`GET …/members` → 403). */
function parseFetchMembersRosterParam(value: string | string[] | undefined): boolean {
  const v = resolvedParam(value).toLowerCase();
  if (v === '0' || v === 'false' || v === 'off' || v === 'no') {
    return false;
  }
  return true;
}

export default function HomeGroupDetailRoute(): ReactElement {
  const { groupId: rawId, roster: rawRoster } = useLocalSearchParams<{
    groupId: string | string[];
    roster?: string | string[];
  }>();
  const groupId = resolvedParam(rawId);
  const fetchMembersRoster = parseFetchMembersRosterParam(rawRoster);

  const onBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/home');
  }, []);

  return (
    <GroupDetailRouteView
      groupId={groupId}
      onBack={onBack}
      fetchMembersRoster={fetchMembersRoster}
    />
  );
}
