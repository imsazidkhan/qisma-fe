import type { GroupMemberRosterEntry } from '@/features/groups/types/groupMember.types';
import { DEFAULT_PHONE_REGION } from '@/constants';
import { tryNormalizeToE164 } from '@/utils';

export const ADD_MEMBER_INVITE_ROW_STATES = ['add', 'invited', 'member', 'pending'] as const;
export type AddMemberInviteRowState = (typeof ADD_MEMBER_INVITE_ROW_STATES)[number];

function rosterEntryToInviteRowState(entry: GroupMemberRosterEntry): 'member' | 'pending' {
  return entry.status === 'pending' ? 'pending' : 'member';
}

function normalizeInvitePhoneKey(raw: string): string {
  const t = raw.trim();
  const n = tryNormalizeToE164(t, DEFAULT_PHONE_REGION);
  return n ?? t;
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function findRosterByUserId(
  roster: GroupMemberRosterEntry[] | undefined,
  userId: string,
): GroupMemberRosterEntry | undefined {
  return roster?.find((r) => r.id === userId);
}

function findRosterByUsername(
  roster: GroupMemberRosterEntry[] | undefined,
  username: string,
): GroupMemberRosterEntry | undefined {
  const needle = normalizeUsername(username);
  if (!needle) return undefined;
  return roster?.find((r) => {
    const ru = r.username?.trim();
    if (!ru) return false;
    return normalizeUsername(ru) === needle;
  });
}

function findRosterByIdentifier(
  roster: GroupMemberRosterEntry[] | undefined,
  e164: string,
): GroupMemberRosterEntry | undefined {
  if (!roster?.length) return undefined;
  const needle = normalizeInvitePhoneKey(e164);
  return roster.find((r) => {
    const id = r.identifier?.trim();
    if (!id) return false;
    return normalizeInvitePhoneKey(id) === needle;
  });
}

/**
 * Directory row / userId tab: roster wins; else session “just invited” before cache sync.
 */
export function resolveUserIdInviteRowState(
  roster: GroupMemberRosterEntry[] | undefined,
  userId: string,
  sessionInvitedUserIds: Set<string>,
): AddMemberInviteRowState {
  const entry = findRosterByUserId(roster, userId);
  if (entry) return rosterEntryToInviteRowState(entry);
  if (sessionInvitedUserIds.has(userId)) return 'invited';
  return 'add';
}

/**
 * Manual username submit + optional roster match (normalized username).
 */
export function resolveUsernameInviteRowState(
  roster: GroupMemberRosterEntry[] | undefined,
  username: string,
): AddMemberInviteRowState {
  const entry = findRosterByUsername(roster, username);
  if (!entry) return 'add';
  return rosterEntryToInviteRowState(entry);
}

/**
 * Device suggestions + manual phone: match roster by {@link GroupMemberRosterEntry.identifier}
 * when the API returns E.164; else session invited set only.
 */
export function resolvePhoneInviteRowState(
  roster: GroupMemberRosterEntry[] | undefined,
  e164: string,
  sessionInvitedPhones: Set<string>,
): AddMemberInviteRowState {
  const entry = findRosterByIdentifier(roster, e164);
  if (entry) return rosterEntryToInviteRowState(entry);
  const needle = normalizeInvitePhoneKey(e164);
  for (const p of sessionInvitedPhones) {
    if (normalizeInvitePhoneKey(p) === needle) return 'invited';
  }
  return 'add';
}
