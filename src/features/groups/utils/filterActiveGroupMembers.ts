import type { GroupMemberRosterEntry } from '@/features/groups/types/groupMember.types';

/**
 * Participants eligible for split / expense UIs (pending invitees excluded until they accept).
 * Owners and admins still receive **full** roster from `GET …/members`; filter only at selection time.
 */
export function filterActiveGroupMembers(
  roster: readonly GroupMemberRosterEntry[],
): GroupMemberRosterEntry[] {
  return roster.filter((m) => m.status === 'active');
}
