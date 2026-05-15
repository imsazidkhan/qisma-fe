import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { ApiError } from '@/api';
import {
  deviceInviteRowsToSyncPayload,
  isContactsSyncPayloadLimitError,
  isContactsSyncRateLimitError,
  postContactsSyncAll,
} from '@/features/contacts/api/contactsSyncApi';
import {
  fetchDeviceContactInviteRows,
  type DeviceContactInviteRow,
} from '@/services/deviceContacts';
import { logger } from '@/services/logger';
import { DEFAULT_PHONE_REGION } from '@/constants';
import { tryNormalizeToE164 } from '@/utils';

export type DeviceContactInviteRowsStatus = 'idle' | 'loading' | 'ready' | 'error';

export type UseDeviceContactInviteRowsResult = {
  rows: DeviceContactInviteRow[];
  status: DeviceContactInviteRowsStatus;
  /** Normalized E.164 → Qisma `userId` when `/v1/contacts/sync` reported a match. */
  registeredByE164: ReadonlyMap<string, string>;
};

/**
 * When the surface is visible and {@link canReadDeviceContacts} is satisfied, loads a capped list
 * of device contacts for the default region, then **POST /v1/contacts/sync** with E.164
 * **`identifier`** rows (best-effort; sync errors do not flip UI to error).
 */
export function useDeviceContactInviteRows(
  visible: boolean,
  contactsLibraryReady: boolean,
): UseDeviceContactInviteRowsResult {
  const [rows, setRows] = useState<DeviceContactInviteRow[]>([]);
  const [status, setStatus] = useState<DeviceContactInviteRowsStatus>('idle');
  const [registeredByE164, setRegisteredByE164] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );

  useEffect(() => {
    if (!visible || !contactsLibraryReady) {
      setRows([]);
      setStatus('idle');
      setRegisteredByE164(new Map());
      return;
    }

    let cancelled = false;
    const ac = new AbortController();
    setStatus('loading');
    setRegisteredByE164(new Map());

    void (async () => {
      try {
        const data = await fetchDeviceContactInviteRows({ maxRows: 48 });
        if (cancelled) return;
        setRows(data);
        setStatus('ready');

        const payload = deviceInviteRowsToSyncPayload(data);
        if (payload.contacts.length > 0) {
          try {
            const syncResult = await postContactsSyncAll(payload, ac.signal);
            if (cancelled) return;
            const next = new Map<string, string>();
            for (const r of syncResult.registered) {
              if (!r.userId) continue;
              const raw = r.identifier?.trim();
              if (!raw) continue;
              const key = tryNormalizeToE164(raw, DEFAULT_PHONE_REGION) ?? raw;
              next.set(key, r.userId);
            }
            setRegisteredByE164(next);
          } catch (e) {
            if (
              e instanceof ApiError &&
              (isContactsSyncRateLimitError(e) || isContactsSyncPayloadLimitError(e))
            ) {
              return;
            }
            logger.captureException(e, {
              tags: { flow: 'contacts_sync_post', platform: Platform.OS },
            });
          }
        }
      } catch {
        if (!cancelled) {
          setRows([]);
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [visible, contactsLibraryReady]);

  return { rows, status, registeredByE164 };
}
