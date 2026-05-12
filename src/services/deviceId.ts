import { STORAGE_KEYS } from '@/constants/storageKeys';

import { storage } from './storage';

/**
 * Returns a stable, opaque device id — generated on first launch and persisted
 * to {@link storage}. Used as the `X-Device-Id` request header for analytics
 * and abuse heuristics.
 *
 * NON-CRYPTOGRAPHIC. Don't use it for anything security-critical (auth,
 * idempotency keys, etc.). The UUID generator below uses `Math.random` so the
 * Hermes JS engine doesn't need a `crypto` polyfill — fine for an opaque
 * analytics tag, NOT fine for a token.
 */
export function getDeviceId(): string {
  const existing = storage.getString(STORAGE_KEYS.deviceId);
  if (existing) return existing;

  const next = generateUuidV4();
  storage.set(STORAGE_KEYS.deviceId, next);
  return next;
}

function generateUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
