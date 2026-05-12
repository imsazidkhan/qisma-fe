import type { TFunction } from 'i18next';

import type { GroupListItem } from '@/features/groups/types/groupsList.types';
import { formatMinorAsCurrency } from '@/features/groups/utils/formatMinorAsCurrency';
import { aggregateGroupBalances } from '@/features/home/utils/aggregateGroupBalances';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function isWithinPastWeek(iso: string | undefined): boolean {
  const raw = iso?.trim();
  if (!raw) return false;
  const ts = new Date(raw).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= WEEK_MS;
}

/**
 * Sentence-case hub subtitle line (no bordered strip). Reflects the filtered list.
 */
export function formatGroupsHubInlineMeta(
  groups: readonly GroupListItem[],
  t: TFunction,
): string | null {
  if (groups.length === 0) {
    return null;
  }

  const totals = aggregateGroupBalances([...groups]);
  const squadCount = groups.length;

  if (totals.hasMixedCurrency) {
    return t('groups.hubMeta.mixed', { count: squadCount });
  }

  const { totalOwedMinor, totalOweMinor, netMinor, currency } = totals;

  if (totalOwedMinor === 0 && totalOweMinor === 0) {
    const everyRowHasFreshActivity =
      groups.length > 0 &&
      groups.every((g) => {
        const raw = g.lastActivityAt?.trim();
        if (!raw) return false;
        return isWithinPastWeek(raw);
      });
    if (everyRowHasFreshActivity) {
      return t('groups.hubMeta.allSettledThisWeek', { count: squadCount });
    }
    return t('groups.hubMeta.allSettled', { count: squadCount });
  }

  if (netMinor < 0) {
    const amt = formatMinorAsCurrency(-netMinor, currency);
    return t('groups.hubMeta.youOwe', {
      amount: amt,
      squads: squadCount,
    });
  }

  if (netMinor > 0) {
    const amt = formatMinorAsCurrency(netMinor, currency);
    return t('groups.hubMeta.youAreOwed', {
      amount: amt,
      squads: squadCount,
    });
  }

  return t('groups.hubMeta.neutral', { squads: squadCount });
}
