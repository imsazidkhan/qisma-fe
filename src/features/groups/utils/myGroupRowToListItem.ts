import { GROUP_TYPE_EMOJI, type GroupTypeId } from '@/features/groups/constants/groupTypes';
import type { GroupListItem } from '@/features/groups/types/groupsList.types';
import type { MyGroupRowDto } from '@/features/groups/types/myGroups.types';

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

function pickMemberCount(row: MyGroupRowDto & Record<string, unknown>): number {
  const raw = row.memberCount;
  return typeof raw === 'number' && Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
}

function pickBalance(row: MyGroupRowDto & Record<string, unknown>): GroupListItem['balance'] {
  const b = row.balance;
  if (b && typeof b === 'object' && b !== null) {
    const o = b as Record<string, unknown>;
    const tone = o.tone;
    const amountMinor = o.amountMinor;
    const currency = o.currency;
    if (
      (tone === 'owed_to_you' || tone === 'you_owe' || tone === 'settled') &&
      typeof amountMinor === 'number' &&
      Number.isFinite(amountMinor) &&
      typeof currency === 'string' &&
      currency.trim().length > 0
    ) {
      return { tone, amountMinor, currency: currency.trim() };
    }
  }
  return {
    tone: 'settled',
    amountMinor: 0,
    currency: 'INR',
  };
}

/** Map `MyGroupRowDto` → shared `GroupListItem` for list cards (home + groups tab). */
export function myGroupRowToListItem(row: MyGroupRowDto): GroupListItem {
  const r = row as MyGroupRowDto & Record<string, unknown>;
  const g = row.group;
  const type = g.type as GroupTypeId;
  const lastAtRaw = typeof r.lastActivityAt === 'string' ? r.lastActivityAt : row.joinedAt;

  return {
    id: g.id,
    name: g.name,
    iconEmoji: GROUP_TYPE_EMOJI[type],
    groupType: type,
    avatarUrl: parseOptionalAvatarUrl(g.avatar),
    memberCount: pickMemberCount(r),
    lastActivityAt: lastAtRaw,
    balance: pickBalance(r),
    role: row.role,
    joinedAt: row.joinedAt,
    isCreator: row.isCreator,
  };
}
