import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, type ReactElement } from 'react';

import { SplitExpenseLuxuryScreen } from '@/features/expenses/screens/SplitExpenseLuxuryScreen';

function resolvedParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] ?? '';
  return '';
}

/**
 * Luxury “Split expense” art direction — exploratory UI layer for lastbench.
 * Optional query: `?amount=1234` seeds split preview totals.
 */
export default function GroupSplitLuxuryRoute(): ReactElement {
  const router = useRouter();
  const { groupId: rawGroupId, amount: rawAmount } = useLocalSearchParams<{
    groupId: string | string[];
    amount?: string | string[];
  }>();
  const groupId = resolvedParam(rawGroupId);
  const initialAmountMajor = resolvedParam(rawAmount);

  const onClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(`/home/group/${encodeURIComponent(groupId)}`);
  }, [groupId, router]);

  return (
    <SplitExpenseLuxuryScreen
      groupId={groupId}
      initialAmountMajor={initialAmountMajor}
      onClose={onClose}
    />
  );
}
