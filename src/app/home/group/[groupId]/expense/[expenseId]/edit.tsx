import { router, useLocalSearchParams } from 'expo-router';
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

  return <AddExpenseScreen editExpenseId={expenseId} groupId={groupId} onClose={onBack} />;
}
