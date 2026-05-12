import type { TFunction } from 'i18next';

import { ApiError } from '@/api';

export function mapInviteFlowError(e: ApiError, tr: TFunction): string {
  const code = e.code;
  const key = `groups.membersScreen.inviteFlowErrors.${code}`;
  const mapped = tr(key);
  if (mapped !== key) return mapped;
  if (e.retryAfter !== undefined && e.retryAfter >= 0) {
    return tr('groups.addMember.errors.retryAfter', { seconds: e.retryAfter });
  }
  return e.message || tr('groups.membersScreen.inviteFlowErrorGeneric');
}
