import type { GroupListItem } from '@/features/groups/types/groupsList.types';

export type GroupBalanceTotals = {
  currency: string;
  totalOwedMinor: number;
  totalOweMinor: number;
  /** Positive = you are up (owed more than you owe). */
  netMinor: number;
  /**
   * True when non-settled rows disagree on ISO currency — cross-group totals are not summed.
   */
  hasMixedCurrency: boolean;
};

function effectiveCurrency(item: GroupListItem): string {
  const raw = item.balance.currency.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(raw) ? raw : 'INR';
}

function primaryDisplayCurrency(items: GroupListItem[]): string {
  for (const g of items) {
    const raw = g.balance.currency.trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(raw)) {
      return raw;
    }
  }
  return 'INR';
}

/**
 * Sums per-group balances from home **`GET /v1/users/me/groups`** list rows.
 * Only amounts in the same contributing currency are summed; mixed settlement currencies hide totals.
 */
export function aggregateGroupBalances(items: GroupListItem[]): GroupBalanceTotals {
  const contributingCodes = new Set<string>();
  for (const g of items) {
    if (g.balance.tone === 'owed_to_you' || g.balance.tone === 'you_owe') {
      contributingCodes.add(effectiveCurrency(g));
    }
  }

  const hasMixedCurrency = contributingCodes.size > 1;

  if (hasMixedCurrency) {
    const sorted = [...contributingCodes].sort();
    return {
      currency: sorted[0] ?? 'INR',
      totalOwedMinor: 0,
      totalOweMinor: 0,
      netMinor: 0,
      hasMixedCurrency: true,
    };
  }

  const targetCurrency = contributingCodes.size === 1 ? [...contributingCodes][0]! : null;

  let totalOwedMinor = 0;
  let totalOweMinor = 0;

  for (const g of items) {
    if (g.balance.tone === 'settled') {
      continue;
    }
    if (targetCurrency !== null && effectiveCurrency(g) !== targetCurrency) {
      continue;
    }
    if (targetCurrency === null) {
      continue;
    }

    const amt = g.balance.amountMinor;
    if (!Number.isFinite(amt)) {
      continue;
    }

    if (g.balance.tone === 'owed_to_you') {
      totalOwedMinor += amt;
    } else if (g.balance.tone === 'you_owe') {
      totalOweMinor += amt;
    }
  }

  const currency = targetCurrency ?? primaryDisplayCurrency(items);

  return {
    currency,
    totalOwedMinor,
    totalOweMinor,
    netMinor: totalOwedMinor - totalOweMinor,
    hasMixedCurrency: false,
  };
}
