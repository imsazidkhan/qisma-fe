import type { QueryClient } from '@tanstack/react-query';

import type { ExpenseDetail } from '@/features/expenses/types/expenseDetail.types';
import type { GroupBalancesSnapshot } from '@/features/expenses/types/expense.types';
import type { GroupViewerBalancesPayload } from '@/features/groups/types/groupBalancesViewer.types';
import { groupsQueryKeys } from '@/features/groups/queryKeys';

type BalanceTone = 'owed_to_you' | 'you_owe';

function edgeAmountScore(amount: string): number {
  const n = Number(String(amount).replace(/,/g, ''));
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.abs(n);
}

function pickCounterpartyFromViewerBalances(
  payload: GroupViewerBalancesPayload | undefined,
  tone: BalanceTone,
): string | undefined {
  if (!payload?.balances?.length) {
    return undefined;
  }

  let bestCounterparty: string | undefined;
  let bestScore = -1;

  for (const b of payload.balances) {
    if (tone === 'you_owe' && b.type === 'owe') {
      if (b.amount > bestScore) {
        bestScore = b.amount;
        bestCounterparty = b.user.id;
      }
    } else if (tone === 'owed_to_you' && b.type === 'owed') {
      if (b.amount > bestScore) {
        bestScore = b.amount;
        bestCounterparty = b.user.id;
      }
    }
  }

  return bestCounterparty;
}

/**
 * Picks counterparty from **`GET …/balances`** viewer payload first, then from any cached **expense detail**
 * for this group (largest matching settlement edge).
 */
export function pickCounterpartyUserIdFromCachedExpenseBalances(
  queryClient: QueryClient,
  groupId: string,
  currentUserId: string | undefined,
  tone: BalanceTone,
): string | undefined {
  if (!currentUserId) {
    return undefined;
  }

  const viewer = queryClient.getQueryData<GroupViewerBalancesPayload>(
    groupsQueryKeys.balances(groupId),
  );
  const fromDedicated = pickCounterpartyFromViewerBalances(viewer, tone);
  if (fromDedicated) {
    return fromDedicated;
  }

  let bestCounterparty: string | undefined;
  let bestScore = 0;

  for (const query of queryClient.getQueryCache().getAll()) {
    const key = query.queryKey;
    if (key[0] !== 'expenses' || key[1] !== 'detail') {
      continue;
    }
    const data = query.state.data as
      | (ExpenseDetail & { groupBalances?: GroupBalancesSnapshot })
      | undefined;
    if (!data || data.groupId !== groupId) {
      continue;
    }
    const edges = data.groupBalances?.edges;
    if (!edges?.length) {
      continue;
    }

    for (const e of edges) {
      if (tone === 'you_owe' && e.fromUserId === currentUserId) {
        const score = edgeAmountScore(e.amount);
        if (score > bestScore) {
          bestScore = score;
          bestCounterparty = e.toUserId;
        }
      } else if (tone === 'owed_to_you' && e.toUserId === currentUserId) {
        const score = edgeAmountScore(e.amount);
        if (score > bestScore) {
          bestScore = score;
          bestCounterparty = e.fromUserId;
        }
      }
    }
  }

  return bestCounterparty;
}
