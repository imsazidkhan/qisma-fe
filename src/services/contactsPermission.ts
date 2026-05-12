import type { ContactsPermissionResponse } from 'expo-contacts';
import * as Contacts from 'expo-contacts';
import { Linking, Platform } from 'react-native';

import { logger } from '@/services/logger';

/** Re-export for callers that store the latest OS snapshot (includes iOS `accessPrivileges`). */
export type { ContactsPermissionResponse };

/**
 * Normalized UX states for contacts (maps Expo {@link Contacts.PermissionResponse}).
 *
 * - **granted** — `granted === true`
 * - **undetermined** — system has not been asked yet (`status === 'undetermined'`)
 * - **denied** — user declined, but the OS may still show the permission prompt again (`canAskAgain === true`)
 * - **blocked** — prompt cannot be shown again; user must enable in system Settings (`denied` + `canAskAgain === false`)
 * - **unknown** — unavailable (e.g. web) or read failed (`null` snapshot)
 */
export type ContactsPermissionUiState =
  | 'unknown'
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'blocked';

export function resolveContactsPermissionUiState(
  snapshot: ContactsPermissionResponse | null,
): ContactsPermissionUiState {
  if (snapshot === null) return 'unknown';
  if (snapshot.granted || snapshot.status === 'granted') return 'granted';
  if (snapshot.status === 'undetermined') return 'undetermined';
  if (snapshot.status === 'denied' && snapshot.canAskAgain === false) return 'blocked';
  if (snapshot.status === 'denied') return 'denied';
  return 'unknown';
}

/**
 * Contacts permission via **`expo-contacts`** on **iOS** and **Android**. Use
 * {@link getContactsPermission}, {@link requestContactsPermission}, and {@link requestContactsAccess}.
 * Use {@link canReadDeviceContacts} before calling **`getContactsAsync`**.
 *
 * **iOS** — `NSContactsUsageDescription` comes from the `expo-contacts` plugin in `app.config.ts`
 * (`contactsPermission`). iOS 18+ may set {@link ContactsPermissionResponse#accessPrivileges} to
 * `all`, `limited`, or `none`; {@link canReadDeviceContacts} requires granted access and not `none`.
 *
 * **Android** — Manifest permissions are merged at prebuild; runtime prompts use the same JS API.
 * Permanent deny (`canAskAgain === false`) is treated as **blocked**; {@link requestContactsAccess}
 * sends the user to app Settings.
 *
 * **Web** — Not supported; helpers return `null` without native calls.
 *
 * @see https://docs.expo.dev/versions/latest/sdk/contacts/
 */

/**
 * Whether the app may call `getContactsAsync` and expect device data (iOS + Android).
 *
 * **iOS** — Requires system **granted** plus {@link ContactsPermissionResponse#accessPrivileges}
 * not `'none'` (iOS 18+ limited/all still returns contacts for the allowed set).
 *
 * **Android** — `granted` is sufficient (`accessPrivileges` is unused).
 */
export function canReadDeviceContacts(snapshot: ContactsPermissionResponse | null): boolean {
  if (snapshot === null) return false;
  if (!snapshot.granted && snapshot.status !== 'granted') return false;
  if (Platform.OS === 'ios' && snapshot.accessPrivileges === 'none') return false;
  return true;
}

export function isNativeContactsSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Current contacts permission from the OS (no prompt).
 */
export async function getContactsPermission(): Promise<ContactsPermissionResponse | null> {
  if (!isNativeContactsSupported()) return null;
  try {
    return await Contacts.getPermissionsAsync();
  } catch (e) {
    logger.captureException(e, {
      tags: { flow: 'contacts_permission_get', platform: Platform.OS },
    });
    return null;
  }
}

/**
 * Shows the system contacts permission UI when status is still undetermined (or equivalent).
 */
export async function requestContactsPermission(): Promise<ContactsPermissionResponse | null> {
  if (!isNativeContactsSupported()) return null;
  try {
    return await Contacts.requestPermissionsAsync();
  } catch (e) {
    logger.captureException(e, {
      tags: { flow: 'contacts_permission_request', platform: Platform.OS },
    });
    return null;
  }
}

/**
 * Opens the app’s page in system Settings (user can toggle Contacts there on both platforms).
 */
export async function openContactsRelatedSettings(): Promise<void> {
  await Linking.openSettings();
}

export type ContactsGateAction = 'opened_settings' | 'prompted' | 'already_granted' | 'noop';

export type RequestContactsAccessResult = {
  permission: ContactsPermissionResponse | null;
  action: ContactsGateAction;
};

/**
 * Single entry for the Add Members flow:
 * - **granted** → no-op.
 * - **blocked** (`denied` + `canAskAgain === false`) → open Settings (iOS/Android won’t show the dialog again).
 * - **undetermined** or **denied** with `canAskAgain === true` → `requestPermissionsAsync()`.
 */
export async function requestContactsAccess(
  current: ContactsPermissionResponse | null,
): Promise<RequestContactsAccessResult> {
  if (!isNativeContactsSupported()) {
    return { permission: null, action: 'noop' };
  }

  let snapshot = current;
  if (!snapshot) {
    snapshot = await getContactsPermission();
    if (!snapshot) {
      return { permission: null, action: 'noop' };
    }
  }

  const ui = resolveContactsPermissionUiState(snapshot);

  if (ui === 'granted') {
    return { permission: snapshot, action: 'already_granted' };
  }

  if (ui === 'blocked') {
    await openContactsRelatedSettings();
    return { permission: snapshot, action: 'opened_settings' };
  }

  const requested = await requestContactsPermission();
  const next = requested ?? snapshot;
  return { permission: next, action: 'prompted' };
}
