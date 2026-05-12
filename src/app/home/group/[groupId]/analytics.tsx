import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, type ReactElement } from 'react';

import { GroupAnalyticsScreen } from '@/features/groups/components/GroupAnalyticsScreen';

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

  return <GroupAnalyticsScreen groupId={groupId} onBack={onBack} />;
}
