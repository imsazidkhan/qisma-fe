import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import {
  canReadDeviceContacts,
  getContactsPermission,
  isNativeContactsSupported,
  requestContactsAccess,
  resolveContactsPermissionUiState,
  type ContactsPermissionResponse,
  type ContactsPermissionUiState,
} from '@/services/contactsPermission';

export type UseContactsPermissionResult = {
  permission: ContactsPermissionResponse | null;
  /** Derived UX state: granted · denied · blocked · undetermined · unknown */
  contactsUiState: ContactsPermissionUiState;
  /** True when {@link canReadDeviceContacts} allows `getContactsAsync` (iOS + Android). */
  contactsLibraryReady: boolean;
  showIntroCard: boolean;
  requestOrOpenSettings: () => Promise<void>;
  /** Primary CTA opens system Settings (only when {@link contactsUiState} is `blocked`). */
  introPrimaryIsOpenSettings: boolean;
};

/**
 * Bridges {@link requestContactsAccess} to React state. Refreshes when the sheet opens and when
 * the app returns to **active** (e.g. user changed Contacts in iOS/Android Settings).
 */
export function useContactsPermission(visible: boolean): UseContactsPermissionResult {
  const [permission, setPermission] = useState<ContactsPermissionResponse | null>(null);

  const refresh = useCallback(async () => {
    const r = await getContactsPermission();
    setPermission(r);
  }, []);

  useEffect(() => {
    if (!visible) {
      setPermission(null);
      return;
    }
    if (!isNativeContactsSupported()) return;
    void refresh();
  }, [visible, refresh]);

  useEffect(() => {
    if (!visible || !isNativeContactsSupported()) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => sub.remove();
  }, [visible, refresh]);

  const requestOrOpenSettings = useCallback(async () => {
    const { permission: next } = await requestContactsAccess(permission);
    if (next) setPermission(next);
    else {
      const latest = await getContactsPermission();
      if (latest) setPermission(latest);
    }
  }, [permission]);

  const contactsUiState = useMemo(() => resolveContactsPermissionUiState(permission), [permission]);

  const contactsLibraryReady = useMemo(() => canReadDeviceContacts(permission), [permission]);

  const showIntroCard =
    visible &&
    isNativeContactsSupported() &&
    permission !== null &&
    !contactsLibraryReady &&
    contactsUiState !== 'unknown';

  const introPrimaryIsOpenSettings = contactsUiState === 'blocked';

  return {
    permission,
    contactsUiState,
    contactsLibraryReady,
    showIntroCard,
    requestOrOpenSettings,
    introPrimaryIsOpenSettings,
  };
}
