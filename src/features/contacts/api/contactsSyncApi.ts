import { z } from 'zod';

import { ApiError, apiFetch, ENDPOINTS } from '@/api';
import { DEFAULT_PHONE_REGION } from '@/constants';
import type {
  ContactsSyncResult,
  ContactsSyncRegisteredRow,
} from '@/features/contacts/types/contactsSync.types';
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

const registeredWireSchema = z
  .object({
    userId: z.string().uuid(),
    name: z.union([z.string(), z.null()]).optional(),
    username: z.union([z.string(), z.null()]).optional(),
    avatar: z.union([z.string(), z.null()]).optional(),
    identifier: z.union([z.string(), z.null()]).optional(),
    phone: z.union([z.string(), z.null()]).optional(),
    phoneE164: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();

function normalizeRegisteredRow(
  raw: z.infer<typeof registeredWireSchema>,
): ContactsSyncRegisteredRow {
  const identifier = raw.identifier ?? raw.phone ?? raw.phoneE164 ?? null;
  const trimmed = typeof identifier === 'string' ? identifier.trim() : '';
  return {
    userId: raw.userId,
    name: typeof raw.name === 'string' ? raw.name.trim() || null : null,
    username: typeof raw.username === 'string' ? raw.username.trim() || null : null,
    avatar: typeof raw.avatar === 'string' ? raw.avatar.trim() || null : null,
    identifier: trimmed.length > 0 ? trimmed : null,
  };
}

function parseSyncedCountWire(raw: unknown): number | null {
  if (raw === undefined || raw === null) {
    return null;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(0, Math.floor(raw));
  }
  if (typeof raw === 'string') {
    const n = Number.parseInt(raw.trim(), 10);
    return Number.isFinite(n) ? Math.max(0, n) : null;
  }
  return null;
}

function normalizeUnregisteredIdentifier(raw: string): string {
  const t = raw.trim();
  if (t === '') return '';
  return tryNormalizeToE164(t, DEFAULT_PHONE_REGION) ?? t;
}

function parseContactsSyncData(data: unknown): ContactsSyncResult {
  const empty: ContactsSyncResult = {
    registered: [],
    syncedCount: null,
    unregistered: [],
  };
  if (data == null) return empty;
  if (typeof data !== 'object') return empty;

  const o = data as Record<string, unknown>;
  const syncedCount = parseSyncedCountWire(o.syncedCount ?? o.synced_count);

  const unregisteredRaw = o.unregistered ?? o.notRegistered ?? o.not_registered;
  const unregisteredNorm = new Set<string>();
  if (Array.isArray(unregisteredRaw)) {
    for (const el of unregisteredRaw) {
      if (typeof el !== 'string') continue;
      const key = normalizeUnregisteredIdentifier(el);
      if (key !== '') unregisteredNorm.add(key);
    }
  }

  const candidates = [o.registered, o.onApp, o.matches, o.onQuisma];
  let listRaw: unknown = null;
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0) {
      listRaw = c;
      break;
    }
  }

  const registered: ContactsSyncRegisteredRow[] = [];
  if (Array.isArray(listRaw)) {
    for (const el of listRaw) {
      const row = registeredWireSchema.safeParse(el);
      if (row.success) {
        registered.push(normalizeRegisteredRow(row.data));
      }
    }
  }

  return {
    registered,
    syncedCount,
    unregistered: [...unregisteredNorm],
  };
}

/**
 * `POST /v1/contacts/sync` — upload normalized identifiers (E.164 phones) for server-side matching.
 * Parses `registered` / `matches` / `onApp` rows (first non-empty array wins), plus `syncedCount`
 * and `unregistered` identifiers when present.
 */
export async function postContactsSync(
  body: ContactsSyncRequest,
  signal?: AbortSignal,
): Promise<ContactsSyncResult> {
  const data = await apiFetch<unknown>(ENDPOINTS.contacts.sync, {
    method: 'POST',
    body,
    signal,
  });
  return parseContactsSyncData(data);
}

/**
 * Max identifiers per `POST /contacts/sync` body. Backends often cap batch size; chunk larger uploads.
 */
export const CONTACTS_SYNC_MAX_IDENTIFIERS_PER_REQUEST = 40;

const CONTACTS_SYNC_LIMIT_ERROR_CODES = new Set([
  'CONTACT_SYNC_LIMIT_EXCEEDED',
  'CONTACTS_SYNC_LIMIT_EXCEEDED',
  'CONTACT_SYNC_BATCH_LIMIT_EXCEEDED',
  'SYNC_LIMIT_EXCEEDED',
]);

const CONTACTS_SYNC_RATE_LIMIT_CODES = new Set([
  'RATE_LIMITED',
  'CONTACT_SYNC_RATE_LIMITED',
  'CONTACT_SYNC_RATE_LIMIT_EXCEEDED',
  'CONTACTS_SYNC_RATE_LIMIT_EXCEEDED',
]);

function parseRetryAfterSecondsFromMessage(message: string): number | undefined {
  const m = /after\s+(\d+)\s*seconds?/i.exec(message);
  if (!m?.[1]) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

export function isContactsSyncRateLimitError(e: unknown): boolean {
  if (!(e instanceof ApiError)) return false;
  if (e.status === 429) return true;
  if (CONTACTS_SYNC_RATE_LIMIT_CODES.has(e.code)) return true;
  if (e.message.toLowerCase().includes('rate limit')) return true;
  return false;
}

/** Seconds until retry, from {@link ApiError.retryAfter} or server message text. */
export function getContactsSyncRetryAfterSeconds(e: unknown): number | undefined {
  if (!(e instanceof ApiError)) return undefined;
  if (e.retryAfter !== undefined && e.retryAfter >= 0) return e.retryAfter;
  return parseRetryAfterSecondsFromMessage(e.message);
}

export function isContactsSyncPayloadLimitError(e: unknown): boolean {
  if (!(e instanceof ApiError)) return false;
  if (isContactsSyncRateLimitError(e)) return false;
  if (CONTACTS_SYNC_LIMIT_ERROR_CODES.has(e.code)) return true;
  const msg = e.message.toLowerCase();
  if (msg.includes('rate limit')) return false;
  if (msg.includes('limit') && (msg.includes('sync') || msg.includes('contact'))) {
    return true;
  }
  return false;
}

/**
 * One or more sync requests — merges `registered` (deduped by `userId`), sums `syncedCount`,
 * unions normalized `unregistered` identifiers.
 */
export async function postContactsSyncAll(
  body: ContactsSyncRequest,
  signal?: AbortSignal,
): Promise<ContactsSyncResult> {
  const { contacts } = body;
  if (contacts.length === 0) {
    return { registered: [], syncedCount: null, unregistered: [] };
  }

  const merged: ContactsSyncRegisteredRow[] = [];
  const seenUserIds = new Set<string>();
  const mergedUnregistered = new Set<string>();
  let syncedSum = 0;
  let sawSyncedCount = false;

  for (let i = 0; i < contacts.length; i += CONTACTS_SYNC_MAX_IDENTIFIERS_PER_REQUEST) {
    const slice = contacts.slice(i, i + CONTACTS_SYNC_MAX_IDENTIFIERS_PER_REQUEST);
    const res = await postContactsSync({ contacts: slice }, signal);
    for (const r of res.registered) {
      if (seenUserIds.has(r.userId)) continue;
      seenUserIds.add(r.userId);
      merged.push(r);
    }
    for (const u of res.unregistered) {
      const key = normalizeUnregisteredIdentifier(u);
      if (key !== '') mergedUnregistered.add(key);
    }
    if (res.syncedCount !== null) {
      sawSyncedCount = true;
      syncedSum += res.syncedCount;
    }
  }

  return {
    registered: merged,
    syncedCount: sawSyncedCount ? syncedSum : null,
    unregistered: [...mergedUnregistered],
  };
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
