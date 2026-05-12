import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, type ReactElement } from 'react';

import { EditExpenseScreen } from '@/features/expenses/screens/EditExpenseScreen';

function resolvedParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return '';
}

export default function GroupEditExpenseRoute(): ReactElement {
  const { groupId: rawGroupId, expenseId: rawExpenseId } = useLocalSearchParams<{
    groupId: string | string[];
    expenseId: string | string[];
  }>();
  const groupId = resolvedParam(rawGroupId);
  const expenseId = resolvedParam(rawExpenseId);

  const onBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(
      `/home/group/${encodeURIComponent(groupId)}/expense/${encodeURIComponent(expenseId)}`,
    );
  }, [expenseId, groupId]);

  return <EditExpenseScreen expenseId={expenseId} groupId={groupId} onBack={onBack} />;
}
