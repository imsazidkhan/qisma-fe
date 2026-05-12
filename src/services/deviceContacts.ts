import * as Contacts from 'expo-contacts';
import { Platform } from 'react-native';

import { DEFAULT_PHONE_REGION } from '@/constants';
import {
  canReadDeviceContacts,
  getContactsPermission,
  isNativeContactsSupported,
} from '@/services/contactsPermission';
import { logger } from '@/services/logger';
import { tryNormalizeToE164, type PhoneRegion } from '@/utils';

/**
 * Fields read for suggested invites: **names** + **phone numbers** + stable id. Does not request
 * emails, notes, addresses, or other contact buckets.
 */
const DEVICE_CONTACT_INVITE_READ_FIELDS = [
  Contacts.Fields.ID,
  Contacts.Fields.Name,
  Contacts.Fields.FirstName,
  Contacts.Fields.LastName,
  Contacts.Fields.PhoneNumbers,
] as const satisfies readonly Contacts.FieldType[];

export type DeviceContactInviteRow = {
  key: string;
  contactId: string;
  displayName: string;
  e164: string;
};

export type FetchDeviceContactInviteRowsOptions = {
  maxRows?: number;
  pageSize?: number;
  region?: PhoneRegion;
};

function displayNameFromContact(contact: Contacts.ExistingContact): string {
  const name = contact.name?.trim();
  if (name) return name;
  const first = contact.firstName?.trim();
  const last = contact.lastName?.trim();
  const parts: string[] = [];
  if (first) parts.push(first);
  if (last) parts.push(last);
  if (parts.length) return parts.join(' ');
  return '';
}

/**
 * Loads device contacts when {@link canReadDeviceContacts} is true for the current OS snapshot.
 * Extracts **display name** (composed or first+last) and **E.164** per usable phone; only
 * {@link DeviceContactInviteRow#e164} is sent on invite. Does not log names or numbers.
 */
export async function fetchDeviceContactInviteRows(
  options: FetchDeviceContactInviteRowsOptions = {},
): Promise<DeviceContactInviteRow[]> {
  const maxRows = options.maxRows ?? 50;
  const pageSize = options.pageSize ?? 400;
  const region = options.region ?? DEFAULT_PHONE_REGION;

  if (!isNativeContactsSupported()) return [];

  const permission = await getContactsPermission();
  if (!canReadDeviceContacts(permission)) return [];

  try {
    const { data } = await Contacts.getContactsAsync({
      fields: [...DEVICE_CONTACT_INVITE_READ_FIELDS],
      pageSize,
    });

    const seenE164 = new Set<string>();
    const rows: DeviceContactInviteRow[] = [];

    for (const contact of data) {
      if (rows.length >= maxRows) break;
      const phones = contact.phoneNumbers ?? [];
      const sorted = [...phones].sort(
        (a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)),
      );
      const displayName = displayNameFromContact(contact);

      for (let i = 0; i < sorted.length; i += 1) {
        if (rows.length >= maxRows) break;
        const p = sorted[i];
        if (!p) continue;
        const raw = p.number?.trim() || p.digits;
        if (!raw) continue;
        const e164 = tryNormalizeToE164(raw, region);
        if (!e164 || seenE164.has(e164)) continue;
        seenE164.add(e164);
        const phoneKeyPart = p.id ?? String(i);
        rows.push({
          key: `${contact.id}:${phoneKeyPart}`,
          contactId: contact.id,
          displayName,
          e164,
        });
      }
    }

    return rows;
  } catch (e) {
    logger.captureException(e, {
      tags: { flow: 'device_contacts_fetch', platform: Platform.OS },
    });
    throw e;
  }
}
