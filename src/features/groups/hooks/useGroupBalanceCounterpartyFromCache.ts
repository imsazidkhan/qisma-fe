import { useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

import { pickCounterpartyUserIdFromCachedExpenseBalances } from '@/features/groups/utils/pickCounterpartyUserIdFromCachedExpenseBalances';

export function useGroupBalanceCounterpartyFromCache(
  groupId: string,
  currentUserId: string | undefined,
  tone: 'owed_to_you' | 'you_owe' | 'settled' | 'preview',
): string | undefined {
  const queryClient = useQueryClient();

  return useSyncExternalStore(
    (onStoreChange) => queryClient.getQueryCache().subscribe(onStoreChange),
    () => {
      if (tone !== 'you_owe' && tone !== 'owed_to_you') {
        return undefined;
      }
      return pickCounterpartyUserIdFromCachedExpenseBalances(
        queryClient,
        groupId,
        currentUserId,
        tone,
      );
    },
    () => undefined,
  );
}
