import type { TFunction } from 'i18next';

import type { GroupExpenseFeedItem } from '@/features/expenses/types/groupExpenseFeed.types';
import { getGroupExpenseFeedSplitLabel } from '@/features/expenses/utils/groupExpenseFeedSplitLabel';

/** Optional Veloraq payer snippet on list rows (`GET …/expenses`). */
export type ExpenseFeedPaidBySnippet = {
  id: string;
  name: string;
  username?: string | null;
  avatar?: string | null;
  avatarUrl?: string | null;
};

export function readExpenseFeedPaidBySnippet(
  item: GroupExpenseFeedItem,
): ExpenseFeedPaidBySnippet | null {
  const r = item as Record<string, unknown>;
  const pb = r.paidBy ?? r.paid_by;
  if (!pb || typeof pb !== 'object' || Array.isArray(pb)) return null;
  const o = pb as Record<string, unknown>;
  const id = typeof o.id === 'string' ? o.id.trim() : '';
  if (!id) return null;
  const name = typeof o.name === 'string' ? o.name.trim() : '';
  const username =
    o.username === null || o.username === undefined ? o.username : String(o.username);
  const avatar =
    typeof o.avatar === 'string'
      ? o.avatar.trim()
      : typeof o.avatarUrl === 'string'
        ? o.avatarUrl.trim()
        : typeof o.photoUrl === 'string'
          ? o.photoUrl.trim()
          : undefined;
  return {
    id,
    name: name || id,
    username: typeof username === 'string' ? username : null,
    avatar: avatar && avatar !== '' ? avatar : null,
    avatarUrl: typeof o.avatarUrl === 'string' ? o.avatarUrl.trim() : null,
  };
}

/** Resolves payer id from `paidByUserId` or Veloraq `paidBy.id`. */
export function readExpenseFeedPaidByUserId(item: GroupExpenseFeedItem): string | undefined {
  const r = item as Record<string, unknown>;
  const direct =
    typeof r.paidByUserId === 'string'
      ? r.paidByUserId.trim()
      : typeof r.paid_by_user_id === 'string'
        ? r.paid_by_user_id.trim()
        : '';
  if (direct !== '') return direct;
  return readExpenseFeedPaidBySnippet(item)?.id;
}

/** Display name from embedded `paidBy` when roster resolution is unavailable. */
export function readExpenseFeedPaidByDisplayName(item: GroupExpenseFeedItem): string | undefined {
  const sn = readExpenseFeedPaidBySnippet(item);
  if (!sn) return undefined;
  if (sn.name.trim() !== '') return sn.name.trim();
  const u = sn.username;
  if (typeof u === 'string' && u.trim() !== '') return `@${u.trim()}`;
  return undefined;
}

/** Optional wire fields on feed items (`passthrough` schema preserves extra keys). */
export function readExpenseFeedSplitTypeKey(item: GroupExpenseFeedItem): string | undefined {
  const r = item as Record<string, unknown>;
  const raw = r.splitType ?? r.split_type;
  return typeof raw === 'string' ? raw.trim().toLowerCase() : undefined;
}

function coerceNonNegativeParticipantCount(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const n = Math.floor(raw);
    return n >= 0 ? n : null;
  }
  if (typeof raw === 'string') {
    const t = raw.trim().replace(/,/g, '');
    if (t === '') return null;
    const n = Number.parseInt(t, 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

/** Ordered distinct participant ids from list-row wire (camel/snake, root + split). */
function extractParticipantIdsFromUnknownArray(raw: unknown): string[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const ordered: string[] = [];
  const seen = new Set<string>();
  for (const x of raw) {
    let id = '';
    if (typeof x === 'string') {
      id = x.trim();
    } else if (typeof x === 'number' && Number.isFinite(x)) {
      id = String(Math.trunc(x));
    } else if (x && typeof x === 'object' && !Array.isArray(x)) {
      const o = x as Record<string, unknown>;
      const cand =
        typeof o.userId === 'string'
          ? o.userId.trim()
          : typeof o.userId === 'number' && Number.isFinite(o.userId)
            ? String(Math.trunc(o.userId))
            : typeof o.id === 'string'
              ? o.id.trim()
              : typeof o.id === 'number' && Number.isFinite(o.id)
                ? String(Math.trunc(o.id))
                : '';
      id = cand;
    }
    if (id === '') continue;
    const k = id.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    ordered.push(id);
  }
  return ordered;
}

function readExpenseFeedSplitRecord(item: GroupExpenseFeedItem): Record<string, unknown> | null {
  const r = item as Record<string, unknown>;
  const split = r.split ?? r.expenseSplit ?? r.expense_split ?? r.splitSummary ?? r.split_summary;
  if (!split || typeof split !== 'object' || Array.isArray(split)) return null;
  return split as Record<string, unknown>;
}

function participantIdsFromSplitLines(lines: unknown[]): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    if (!line || typeof line !== 'object' || Array.isArray(line)) continue;
    const lr = line as Record<string, unknown>;
    const idsRaw =
      lr.participantUserIds ?? lr.participant_user_ids ?? lr.memberIds ?? lr.member_ids;
    if (!Array.isArray(idsRaw)) continue;
    for (const raw of idsRaw) {
      let id = '';
      if (typeof raw === 'string') id = raw.trim();
      else if (typeof raw === 'number' && Number.isFinite(raw)) id = String(Math.trunc(raw));
      if (id === '') continue;
      const k = id.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      ordered.push(id);
    }
  }
  return ordered;
}

export function readExpenseFeedParticipantCount(item: GroupExpenseFeedItem): number | null {
  const r = item as Record<string, unknown>;
  const intKeys = [
    /** Veloraq feed (`ExpenseFeedItemDto`) — authoritative for **`GET …/groups/:groupId/expenses`**. */
    'splitParticipantCount',
    'split_participant_count',
    'participantCount',
    'splitParticipantsCount',
    'includedMemberCount',
    'participant_count',
    'split_participants_count',
    'included_member_count',
    'membersCount',
    'members_count',
    'memberCount',
    'member_count',
  ] as const;
  for (const k of intKeys) {
    const n = coerceNonNegativeParticipantCount(r[k]);
    if (n !== null && n > 0) return n;
  }

  const ids = readExpenseFeedSplitParticipantIds(item);
  return ids.length > 0 ? ids.length : null;
}

export type ExpenseFeedSettlementGlance = 'settled' | 'pending' | 'partial';

export function readExpenseFeedSettlementGlance(
  item: GroupExpenseFeedItem,
): ExpenseFeedSettlementGlance | null {
  const r = item as Record<string, unknown>;
  const raw =
    typeof r.settlementStatus === 'string'
      ? r.settlementStatus
      : typeof r.feedSettlementTone === 'string'
        ? r.feedSettlementTone
        : '';

  const s = raw.trim().toLowerCase();
  if (s === 'settled' || s === 'complete' || s === 'paid' || s === 'reconciled' || s === 'closed') {
    return 'settled';
  }
  if (s === 'partial' || s === 'partially_settled') {
    return 'partial';
  }
  if (s === 'pending' || s === 'open' || s === 'unpaid') {
    return 'pending';
  }

  const flag = r.isSettled;
  if (flag === true) return 'settled';
  return null;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Footer segment: Today · 4:42 PM • Yesterday • May 12, 2026 · … */
export function formatExpenseFeedFooterInstant(iso: string, t: TFunction): string {
  const s = iso.trim();
  if (!s) {
    return t('groups.activity.unknown');
  }
  const expenseAt = new Date(s);
  const ms = expenseAt.getTime();
  if (Number.isNaN(ms)) {
    return t('groups.activity.unknown');
  }

  const clock = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(expenseAt);

  const c0 = startOfLocalDay(expenseAt);
  const n0 = startOfLocalDay(new Date());
  const diffDays = Math.round((n0.getTime() - c0.getTime()) / 86_400_000);

  if (diffDays === 0) {
    return t('groups.detail.expenseFeedCardFooterToday', { clock });
  }
  if (diffDays === 1) {
    return t('groups.detail.expenseFeedCardFooterYesterday', { clock });
  }

  const dateShort = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: expenseAt.getFullYear() !== n0.getFullYear() ? 'numeric' : undefined,
  }).format(expenseAt);
  return t('groups.detail.expenseFeedCardFooterOnDate', { date: dateShort, clock });
}

export function buildExpenseFeedPayerPhrase(
  item: GroupExpenseFeedItem,
  t: TFunction,
  options: {
    currentUserId: string | null | undefined;
    payerDisplayName: string | null | undefined;
  },
): string {
  const payerId = readExpenseFeedPaidByUserId(item);
  const isYou = Boolean(options.currentUserId && payerId && payerId === options.currentUserId);
  if (isYou) {
    return t('groups.detail.expenseFeedCardPaidByYou');
  }
  if (options.payerDisplayName && options.payerDisplayName.trim() !== '') {
    return t('groups.detail.expenseFeedCardPaidByNamed', {
      name: options.payerDisplayName.trim(),
    });
  }
  const fallback = readExpenseFeedPaidByDisplayName(item);
  if (fallback) {
    return t('groups.detail.expenseFeedCardPaidByNamed', { name: fallback });
  }
  return t('groups.detail.expenseFeedCardPaidByUnknown');
}

export function buildExpenseFeedSplitPhrase(item: GroupExpenseFeedItem, t: TFunction): string {
  return getGroupExpenseFeedSplitLabel(item, t);
}

export function buildExpenseFeedContextLine(
  item: GroupExpenseFeedItem,
  t: TFunction,
  options: {
    currentUserId: string | null | undefined;
    payerDisplayName: string | null | undefined;
  },
): string {
  const payerPhrase = buildExpenseFeedPayerPhrase(item, t, options);
  const splitBody = buildExpenseFeedSplitPhrase(item, t);
  const sep = t('groups.detail.expenseFeedCardBullet');
  return `${payerPhrase}${sep}${splitBody}`;
}

/** Participant faces for feed/detail previews (`splitParticipantPreview`, legacy keys, …). */
export type ExpenseFeedParticipantFace = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

function readExpenseFeedSplitParticipantIds(item: GroupExpenseFeedItem): string[] {
  const r = item as Record<string, unknown>;
  const rootKeys = [
    'participantUserIds',
    'participant_user_ids',
    'includedMembers',
    'included_members',
    'memberIds',
    'member_ids',
    'splitParticipantIds',
    'split_participant_ids',
  ] as const;
  for (const k of rootKeys) {
    const ids = extractParticipantIdsFromUnknownArray(r[k]);
    if (ids.length > 0) return ids;
  }

  const split = readExpenseFeedSplitRecord(item);
  if (!split) return [];

  const participantUserIds =
    split.participantUserIds ?? split.participant_user_ids ?? split.memberIds ?? split.member_ids;
  if (Array.isArray(participantUserIds)) {
    const ids = extractParticipantIdsFromUnknownArray(participantUserIds);
    if (ids.length > 0) return ids;
  }

  const lines = split.lines;
  if (!Array.isArray(lines) || lines.length === 0) return [];
  return participantIdsFromSplitLines(lines);
}

function pushExpenseFeedFaceFromRow(
  o: Record<string, unknown>,
  out: ExpenseFeedParticipantFace[],
): void {
  let idRaw =
    typeof o.id === 'string'
      ? o.id.trim()
      : typeof o.userId === 'string'
        ? o.userId.trim()
        : typeof o.id === 'number' && Number.isFinite(o.id)
          ? String(Math.trunc(o.id))
          : typeof o.userId === 'number' && Number.isFinite(o.userId)
            ? String(Math.trunc(o.userId))
            : '';
  let nameRaw = typeof o.name === 'string' ? o.name.trim() : '';
  if (nameRaw === '' && typeof o.username === 'string') {
    nameRaw = o.username.trim();
  }
  let avatarRaw =
    typeof o.avatar === 'string'
      ? o.avatar.trim()
      : typeof o.avatarUrl === 'string'
        ? o.avatarUrl.trim()
        : '';

  const nested = o.user;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const u = nested as Record<string, unknown>;
    if (!idRaw && typeof u.id === 'string') idRaw = u.id.trim();
    if (!idRaw && typeof u.userId === 'string') idRaw = u.userId.trim();
    if (!nameRaw && typeof u.name === 'string') nameRaw = u.name.trim();
    if (!avatarRaw && typeof u.avatar === 'string') avatarRaw = u.avatar.trim();
    if (!avatarRaw && typeof u.avatarUrl === 'string') avatarRaw = u.avatarUrl.trim();
  }

  if (!idRaw) return;

  out.push({
    id: idRaw,
    name: nameRaw !== '' ? nameRaw : idRaw,
    avatarUrl: avatarRaw !== '' ? avatarRaw : null,
  });
}

export function readExpenseFeedParticipantFaces(
  item: GroupExpenseFeedItem,
): ExpenseFeedParticipantFace[] {
  const r = item as Record<string, unknown>;
  /** Veloraq **`ExpenseFeedItemDto.splitParticipantPreview`** (max 2) + **`splitParticipantCount`** for `+N`. */
  const splitPreview = r.splitParticipantPreview ?? r.split_participant_preview;
  if (Array.isArray(splitPreview) && splitPreview.length > 0) {
    const out: ExpenseFeedParticipantFace[] = [];
    for (const row of splitPreview) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
      pushExpenseFeedFaceFromRow(row as Record<string, unknown>, out);
    }
    if (out.length > 0) {
      return out;
    }
  }

  const arrays = [
    r.participantPreview,
    r.participantsPreview,
    r.participants,
    r.splitParticipants,
    r.split_members,
    r.memberPreview,
    r.members_preview,
    r.participant_preview,
    r.participants_preview,
    r.split_participants,
  ];

  for (const arr of arrays) {
    if (!Array.isArray(arr) || arr.length === 0) {
      continue;
    }
    const out: ExpenseFeedParticipantFace[] = [];
    for (const row of arr) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
      pushExpenseFeedFaceFromRow(row as Record<string, unknown>, out);
    }
    if (out.length > 0) {
      return out;
    }
  }

  const splitIds = readExpenseFeedSplitParticipantIds(item);
  if (splitIds.length > 0) {
    return splitIds.map((id) => ({
      id,
      name: '',
      avatarUrl: null,
    }));
  }

  const paid = readExpenseFeedPaidBySnippet(item);
  if (paid) {
    return [
      {
        id: paid.id,
        name: paid.name,
        avatarUrl: paid.avatar ?? paid.avatarUrl ?? null,
      },
    ];
  }

  return [];
}
