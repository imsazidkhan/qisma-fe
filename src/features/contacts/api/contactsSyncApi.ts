import { apiFetch, ENDPOINTS } from '@/api';
import { DEFAULT_PHONE_REGION } from '@/constants';
import type { DeviceContactInviteRow } from '@/services/deviceContacts';
import { tryNormalizeToE164 } from '@/utils';

/** Auth-service DTO: each contact is a single `identifier` string (1–48 chars), e.g. E.164. */
const IDENTIFIER_MAX_LEN = 48;

export type ContactsSyncEntry = {
  identifier: string;
};

export type ContactsSyncRequest = {
  contacts: ContactsSyncEntry[];
};

/**
 * `POST /v1/contacts/sync` — upload normalized identifiers (E.164 phones) for server-side matching.
 * Extra fields (`name`, `phoneE164`, etc.) are rejected by validation. Failures are non-blocking
 * for the add-members UI; callers should log only.
 */
export async function postContactsSync(
  body: ContactsSyncRequest,
  signal?: AbortSignal,
): Promise<void> {
  if (body.contacts.length === 0) return;

  await apiFetch<unknown>(ENDPOINTS.contacts.sync, {
    method: 'POST',
    body,
    signal,
  });
}

export function deviceInviteRowsToSyncPayload(rows: DeviceContactInviteRow[]): ContactsSyncRequest {
  const contacts: ContactsSyncEntry[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const normalized = tryNormalizeToE164(r.e164, DEFAULT_PHONE_REGION);
    if (!normalized) continue;
    const identifier = normalized.trim();
    if (identifier.length < 1 || identifier.length > IDENTIFIER_MAX_LEN) continue;
    if (seen.has(identifier)) continue;
    seen.add(identifier);
    contacts.push({ identifier });
  }
  return { contacts };
}
