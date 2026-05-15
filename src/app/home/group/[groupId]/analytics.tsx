import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, type ReactElement } from 'react';

import { hrefGroupMembers } from '@/constants/routes';
import { GroupAnalyticsScreen } from '@/features/groups/components/GroupAnalyticsScreen';
import { isUuid } from '@/features/groups/utils/isUuid';

function resolvedParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] ?? '';
  return '';
}

export default function HomeGroupAnalyticsRoute(): ReactElement {
  const { groupId: rawId } = useLocalSearchParams<{ groupId: string | string[] }>();
  const groupId = resolvedParam(rawId);

  const onBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/home');
  }, []);

  const openMembers = useCallback(() => {
    if (!isUuid(groupId)) return;
    router.push(hrefGroupMembers(groupId));
  }, [groupId]);

  return (
    <GroupAnalyticsScreen
      groupId={groupId}
      onBack={onBack}
      onOpenMembers={isUuid(groupId) ? openMembers : undefined}
    />
  );
}
