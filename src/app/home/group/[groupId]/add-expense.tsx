import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, type ReactElement } from 'react';

import { AddExpenseScreen } from '@/features/expenses/screens/AddExpenseScreen';

function resolvedParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return '';
}

export default function GroupAddExpenseRoute(): ReactElement {
  const router = useRouter();
  const { groupId: rawGroupId } = useLocalSearchParams<{ groupId: string | string[] }>();
  const groupId = resolvedParam(rawGroupId);

  const onClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(`/home/group/${encodeURIComponent(groupId)}`);
  }, [groupId, router]);

  return <AddExpenseScreen groupId={groupId} onClose={onClose} />;
}
