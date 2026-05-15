import type { AddGroupMemberBody } from '@/features/groups/api/groupMembersApi';
import type { GroupMemberRosterEntry } from '@/features/groups/types/groupMember.types';
import { resolvePhoneInviteRowState } from '@/features/groups/utils/resolveAddMemberInviteRowState';
import { DEFAULT_PHONE_REGION } from '@/constants';
import { tryNormalizeToE164 } from '@/utils';

function phoneKey(raw: string): string {
  return tryNormalizeToE164(raw, DEFAULT_PHONE_REGION) ?? raw.trim();
}

function bodyKey(body: AddGroupMemberBody): string {
  if ('userId' in body) return `u:${body.userId}`;
  if ('username' in body) return `w:${body.username}`;
  return `p:${phoneKey(body.identifier)}`;
}

/**
 * Builds de-duplicated invite bodies for phones already on Qisma (`userId`) vs off-network (`identifier`).
 */
export function buildPhoneInviteBatch(args: {
  roster: GroupMemberRosterEntry[] | undefined;
  selectedE164s: ReadonlySet<string>;
  manualPhoneRaw: string | null;
  manualPhoneIncluded: boolean;
  registeredByE164: ReadonlyMap<string, string>;
}): AddGroupMemberBody[] {
  const { roster, selectedE164s, manualPhoneRaw, manualPhoneIncluded, registeredByE164 } = args;
  const sessionEmpty = new Set<string>();
  const out: AddGroupMemberBody[] = [];
  const seen = new Set<string>();

  const pushIfAdd = (e164Raw: string): void => {
    const id = phoneKey(e164Raw);
    if (resolvePhoneInviteRowState(roster, id, sessionEmpty) !== 'add') return;
    const userId = registeredByE164.get(id);
    const body: AddGroupMemberBody = userId ? { userId } : { identifier: id };
    const k = bodyKey(body);
    if (seen.has(k)) return;
    seen.add(k);
    out.push(body);
  };

  for (const e164 of selectedE164s) {
    pushIfAdd(e164);
  }

  if (manualPhoneIncluded && manualPhoneRaw) {
    pushIfAdd(manualPhoneRaw);
  }

  return out;
}
