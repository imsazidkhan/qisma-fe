import type { TFunction } from 'i18next';

import type { GroupExpenseFeedItem } from '@/features/expenses/types/groupExpenseFeed.types';

export function getGroupExpenseFeedSplitLabel(item: GroupExpenseFeedItem, t: TFunction): string {
  const r = item as Record<string, unknown>;
  const raw = r.splitType ?? r.split_type;
  if (typeof raw !== 'string') {
    return t('groups.detail.hubActivitySplitFallback');
  }
  const st = raw.trim().toLowerCase();
  switch (st) {
    case 'equal':
      return t('groups.detail.hubActivitySplitEqual');
    case 'exact':
      return t('groups.detail.hubActivitySplitExact');
    case 'percentage':
    case 'percent':
      return t('groups.detail.hubActivitySplitPercent');
    case 'shares':
    case 'share':
      return t('groups.detail.hubActivitySplitShares');
    case 'adjust':
    case 'adjustment':
      return t('groups.detail.hubActivitySplitAdjust');
    default:
      return t('groups.detail.hubActivitySplitFallback');
  }
}
