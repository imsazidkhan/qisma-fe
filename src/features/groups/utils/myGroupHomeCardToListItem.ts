import {
  GROUP_TYPE_EMOJI,
  GROUP_TYPE_ORDER,
  type GroupTypeId,
} from '@/features/groups/constants/groupTypes';
import type { GroupListItem } from '@/features/groups/types/groupsList.types';
import { parseSignedMinorInt } from '@/features/groups/utils/parseSignedMinorInt';

export type MyGroupHomeCardWire = {
  groupId: string;
  group: {
    avatar?: string | null;
    name: string;
    type: GroupTypeId | string;
  };
  memberCount?: unknown;
  expenseCount?: unknown;
  recentExpenseTitle?: string | null;
  balanceNetMinor: unknown;
  dominantCurrency: string;
  balanceBucket: 'owe' | 'get_back' | 'settled';
  pendingSettlementCount?: unknown;
  lastActivityAt?: string | null;
  lastActivityType?: string | null;
  lastActivityActorName?: string | null;
  lastActivityPreview?: string | null;
  balanceUpdatedAt?: string | null;
  role?: string;
  joinedAt?: string;
  isCreator?: boolean;
};

function parseOptionalAvatarUrl(raw: string | null | undefined): string | undefined {
  if (raw == null) return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return undefined;
    return u.href;
  } catch {
    return undefined;
  }
}

function coerceGroupType(raw: unknown): GroupTypeId {
  if (raw == null) return 'other';
  const v = String(raw).trim().toLowerCase();
  return (GROUP_TYPE_ORDER as readonly string[]).includes(v) ? (v as GroupTypeId) : 'other';
}

function pickNonNegInt(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(0, Math.floor(raw));
  }
  if (typeof raw === 'string') {
    const n = Number.parseInt(raw.trim(), 10);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  return 0;
}

function balanceToneFromBucket(
  bucket: MyGroupHomeCardWire['balanceBucket'],
): GroupListItem['balance']['tone'] {
  if (bucket === 'owe') return 'you_owe';
  if (bucket === 'get_back') return 'owed_to_you';
  return 'settled';
}

/** Map validated home card DTO → {@link GroupListItem} for hub cards. */
export function myGroupHomeCardToListItem(row: MyGroupHomeCardWire): GroupListItem {
  const type = coerceGroupType(row.group.type);
  const net = parseSignedMinorInt(row.balanceNetMinor);
  const tone = balanceToneFromBucket(row.balanceBucket);
  const mag = Math.abs(net);
  const currencyRaw = row.dominantCurrency.trim();
  const currency = currencyRaw.length > 0 ? currencyRaw.toUpperCase() : 'INR';

  const lastAt =
    typeof row.lastActivityAt === 'string' && row.lastActivityAt.trim().length > 0
      ? row.lastActivityAt
      : (row.joinedAt ?? '');

  return {
    id: row.groupId,
    name: row.group.name,
    iconEmoji: GROUP_TYPE_EMOJI[type] ?? GROUP_TYPE_EMOJI.other,
    groupType: type,
    avatarUrl: parseOptionalAvatarUrl(row.group.avatar ?? null),
    memberCount: pickNonNegInt(row.memberCount),
    lastActivityAt: lastAt,
    balance: {
      tone,
      amountMinor: tone === 'settled' ? 0 : mag,
      currency,
    },
    role: row.role,
    joinedAt: row.joinedAt,
    isCreator: row.isCreator,
    expenseCount:
      row.expenseCount !== undefined && row.expenseCount !== null
        ? pickNonNegInt(row.expenseCount)
        : undefined,
    recentExpenseTitle:
      typeof row.recentExpenseTitle === 'string' && row.recentExpenseTitle.trim().length > 0
        ? row.recentExpenseTitle.trim()
        : null,
    pendingSettlementCount:
      row.pendingSettlementCount !== undefined && row.pendingSettlementCount !== null
        ? pickNonNegInt(row.pendingSettlementCount)
        : undefined,
    lastActivityType: row.lastActivityType ?? null,
    lastActivityActorName: row.lastActivityActorName ?? null,
    lastActivityPreview: row.lastActivityPreview ?? null,
    balanceUpdatedAt: row.balanceUpdatedAt ?? null,
  };
}
