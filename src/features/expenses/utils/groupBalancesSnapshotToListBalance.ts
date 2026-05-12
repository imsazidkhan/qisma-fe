import type { GroupBalancesSnapshot } from '@/features/expenses/types/expense.types';
import type { GroupListItem } from '@/features/groups/types/groupsList.types';

/**
 * Maps `groupBalances.netByUserId` for the signed-in user into the home-list
 * `balance` card shape (`amountMinor` = integer minor units).
 *
 * Assumes net values use the same **decimal major-unit string** convention as
 * expense `amount` (e.g. `"12.50"`). If the API uses a different encoding,
 * adjust here once the contract is confirmed.
 */
export function groupBalancesSnapshotToListBalance(
  snapshot: GroupBalancesSnapshot,
  currentUserId: string | undefined,
  fallbackCurrency: string,
): GroupListItem['balance'] {
  const currency = pickCurrency(snapshot, fallbackCurrency);

  if (!currentUserId) {
    return { tone: 'settled', amountMinor: 0, currency };
  }

  const raw = snapshot.netByUserId[currentUserId];
  if (raw === undefined || String(raw).trim() === '') {
    return { tone: 'settled', amountMinor: 0, currency };
  }

  const n = Number(String(raw).replace(/,/g, ''));
  if (!Number.isFinite(n)) {
    return { tone: 'settled', amountMinor: 0, currency };
  }

  const amountMinor = Math.round(Math.abs(n) * 100);
  if (amountMinor === 0) {
    return { tone: 'settled', amountMinor: 0, currency };
  }

  if (n > 0) {
    return { tone: 'owed_to_you', amountMinor, currency };
  }
  return { tone: 'you_owe', amountMinor, currency };
}

function pickCurrency(snapshot: GroupBalancesSnapshot, fallback: string): string {
  const e = snapshot.edges[0];
  const c = e?.currency?.trim();
  if (c) {
    return c;
  }
  const t = fallback.trim();
  return t !== '' ? t : 'INR';
}
