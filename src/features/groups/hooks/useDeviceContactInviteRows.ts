import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import {
  deviceInviteRowsToSyncPayload,
  postContactsSync,
} from '@/features/contacts/api/contactsSyncApi';
import {
  fetchDeviceContactInviteRows,
  type DeviceContactInviteRow,
} from '@/services/deviceContacts';
import { logger } from '@/services/logger';

export type DeviceContactInviteRowsStatus = 'idle' | 'loading' | 'ready' | 'error';

export type UseDeviceContactInviteRowsResult = {
  rows: DeviceContactInviteRow[];
  status: DeviceContactInviteRowsStatus;
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

  useEffect(() => {
    if (!visible || !contactsLibraryReady) {
      setRows([]);
      setStatus('idle');
      return;
    }

    let cancelled = false;
    const ac = new AbortController();
    setStatus('loading');

    void (async () => {
      try {
        const data = await fetchDeviceContactInviteRows({ maxRows: 48 });
        if (cancelled) return;
        setRows(data);
        setStatus('ready');

        const payload = deviceInviteRowsToSyncPayload(data);
        if (payload.contacts.length > 0) {
          try {
            await postContactsSync(payload, ac.signal);
          } catch (e) {
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

  return { rows, status };
}
