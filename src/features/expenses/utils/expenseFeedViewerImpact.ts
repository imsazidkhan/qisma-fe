import type { TFunction } from 'i18next';

import type { GroupExpenseFeedItem } from '@/features/expenses/types/groupExpenseFeed.types';
import {
  readExpenseFeedParticipantCount,
  readExpenseFeedPaidByUserId,
  readExpenseFeedSplitTypeKey,
} from '@/features/expenses/utils/expenseFeedRowFormat';
import { formatExpenseMajorAmount } from '@/features/expenses/utils/formatExpenseMajorAmount';

export type ExpenseFeedViewerImpactChipTone = 'lent' | 'owe' | 'muted';

export type ExpenseFeedViewerImpactChipModel = {
  label: string;
  tone: ExpenseFeedViewerImpactChipTone;
};

function uuidEq(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function coerceMajorAmountString(raw: unknown): string | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return String(raw);
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw.trim().replace(/,/g, '');
  }
  return null;
}

function readStructuredViewerImpact(
  item: GroupExpenseFeedItem,
): { kind: 'lent' | 'owe'; majorStr: string } | null {
  const r = item as Record<string, unknown>;
  const candidates: unknown[] = [
    r.viewerBalanceImpact,
    r.viewer_balance_impact,
    r.feedViewerImpact,
    r.feed_viewer_impact,
    r.viewerImpact,
  ];

  for (const c of candidates) {
    if (!c || typeof c !== 'object' || Array.isArray(c)) continue;
    const o = c as Record<string, unknown>;
    const kindRaw = String(o.kind ?? o.type ?? o.direction ?? '')
      .trim()
      .toLowerCase();
    const major =
      coerceMajorAmountString(o.amountMajor ?? o.amount ?? o.value ?? o.major ?? o.netAmount) ??
      null;
    if (!major) continue;

    if (
      kindRaw === 'lent' ||
      kindRaw === 'credit' ||
      kindRaw === 'receivable' ||
      kindRaw === 'owed_to_you'
    ) {
      return { kind: 'lent', majorStr: major };
    }
    if (
      kindRaw === 'owe' ||
      kindRaw === 'owe_money' ||
      kindRaw === 'debit' ||
      kindRaw === 'you_owe'
    ) {
      return { kind: 'owe', majorStr: major };
    }
  }

  const signedRaw =
    r.viewerNetMinor ??
    r.viewer_net_minor ??
    r.viewerShareMinor ??
    r.viewer_share_minor ??
    r.viewerNetAmount ??
    r.viewer_net_amount;

  if (typeof signedRaw === 'number' && Number.isFinite(signedRaw) && signedRaw !== 0) {
    const absMinor = Math.abs(Math.round(signedRaw));
    const major = String(absMinor / 100);
    return signedRaw > 0 ? { kind: 'lent', majorStr: major } : { kind: 'owe', majorStr: major };
  }
  if (typeof signedRaw === 'string' && signedRaw.trim() !== '') {
    const n = Number.parseInt(signedRaw.trim().replace(/,/g, ''), 10);
    if (Number.isFinite(n) && n !== 0) {
      const absMinor = Math.abs(n);
      const major = String(absMinor / 100);
      return n > 0 ? { kind: 'lent', majorStr: major } : { kind: 'owe', majorStr: major };
    }
  }

  return null;
}

function viewerParticipatesInEqualSplit(item: GroupExpenseFeedItem, viewerId: string): boolean {
  const r = item as Record<string, unknown>;
  const split = r.split;
  if (!split || typeof split !== 'object') {
    return true;
  }
  const o = split as Record<string, unknown>;
  const ids = o.participantUserIds;
  if (!Array.isArray(ids)) {
    return true;
  }
  const cleaned = ids.filter((x): x is string => typeof x === 'string' && x.trim() !== '');
  if (cleaned.length === 0) {
    return true;
  }
  return cleaned.some((id) => uuidEq(id, viewerId));
}

function inferEqualSplitImpact(
  item: GroupExpenseFeedItem,
  viewerId: string,
): { kind: 'lent' | 'owe'; majorStr: string } | null {
  const payerId = readExpenseFeedPaidByUserId(item);
  const n = readExpenseFeedParticipantCount(item);
  const splitKind = readExpenseFeedSplitTypeKey(item);
  const total = Number(String(item.amount).replace(/,/g, ''));
  if (!payerId || !n || n < 2 || !Number.isFinite(total) || total <= 0) {
    return null;
  }
  const isEqualish = splitKind === 'equal' || splitKind === undefined;
  if (!isEqualish) {
    return null;
  }
  if (!viewerParticipatesInEqualSplit(item, viewerId)) {
    return null;
  }

  const share = total / n;
  if (!Number.isFinite(share) || share <= 0) {
    return null;
  }

  if (uuidEq(payerId, viewerId)) {
    const lent = total - share;
    if (!Number.isFinite(lent) || lent <= 0.000001) {
      return null;
    }
    return { kind: 'lent', majorStr: String(lent) };
  }

  return { kind: 'owe', majorStr: String(share) };
}

/**
 * Builds localized payer/split hints (“Paid by you” / “You owe …”) when wire hints exist or when an equal-split heuristic applies.
 */
export function resolveExpenseFeedViewerImpactChip(
  item: GroupExpenseFeedItem,
  currentUserId: string | null | undefined,
  t: TFunction,
): ExpenseFeedViewerImpactChipModel | null {
  const me = typeof currentUserId === 'string' ? currentUserId.trim() : '';
  if (!me) {
    return null;
  }

  const structured = readStructuredViewerImpact(item);
  const inferred = structured ?? inferEqualSplitImpact(item, me);
  if (!inferred) {
    return null;
  }

  if (inferred.kind === 'lent') {
    return { label: t('groups.detail.expenseFeedCardPaidByYou'), tone: 'lent' };
  }
  const label = formatExpenseMajorAmount(inferred.majorStr, item.currency);
  return { label: t('groups.detail.expenseFeedViewerOwe', { amount: label }), tone: 'owe' };
}
