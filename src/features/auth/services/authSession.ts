import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import '../flow';

import { logout, refreshTokens } from '../api/authApi';
import { notifySessionTokensRefreshed } from '../sessionQueryRevalidation';
import { useAuthSessionStore } from '../store/useAuthSessionStore';
import type { VerifyOtpResponse } from '../types/otp.types';

/**
 * Stable Keychain / Keystore namespace — must stay consistent across releases or
 * tokens won't be found after upgrade.
 */
const AUTH_KEYCHAIN_SERVICE = 'com.qisma.auth.tokens';

/**
 * Long-lived refresh token + session meta only. Access token is **never** written
 * here — it lives in `useAuthSessionStore` (memory) only. On web, SecureStore is
 * unavailable; the same keys are stored in `localStorage` so OTP verify can persist
 * the session and navigate to onboarding.
 *
 * @deprecated Legacy key from an older build; removed on read paths.
 */
const KEY_ACCESS_LEGACY = 'qisma.auth.accessToken';
const KEY_REFRESH = 'qisma.auth.refreshToken';
const KEY_META = 'qisma.auth.sessionMeta';

/** `expo-secure-store` ships an empty web implementation — `isAvailableAsync()` is false. */
const USE_WEB_AUTH_STORAGE = Platform.OS === 'web';

type SessionMeta = Pick<VerifyOtpResponse, 'expiresIn' | 'tokenType'> & {
  storedAt: number;
};

function secureOpts(): SecureStore.SecureStoreOptions {
  return {
    keychainService: AUTH_KEYCHAIN_SERVICE,
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  };
}

export type StoredAuthPayload = VerifyOtpResponse & {
  /** Ms epoch when we persisted the refresh bundle (for future refresh logic). */
  storedAt: number;
};

async function requireSecureStore(): Promise<void> {
  const ok = await SecureStore.isAvailableAsync();
  if (!ok) {
    throw new Error(
      'Secure storage is unavailable on this platform (e.g. web). Run on iOS, Android, or a development build.',
    );
  }
}

function persistRefreshBundleWeb(refreshToken: string, metaJson: string): void {
  if (typeof localStorage === 'undefined') {
    throw new Error('Web auth storage requires localStorage.');
  }
  localStorage.setItem(KEY_REFRESH, refreshToken);
  localStorage.setItem(KEY_META, metaJson);
}

async function persistRefreshBundleNative(refreshToken: string, metaJson: string): Promise<void> {
  await requireSecureStore();
  const opts = secureOpts();
  await SecureStore.setItemAsync(KEY_REFRESH, refreshToken, opts);
  await SecureStore.setItemAsync(KEY_META, metaJson, opts);
}

/** Drop legacy on-disk access token if present (older app versions). */
async function clearLegacyAccessKey(): Promise<void> {
  if (USE_WEB_AUTH_STORAGE) {
    try {
      localStorage?.removeItem?.(KEY_ACCESS_LEGACY);
    } catch {
      /* ignore */
    }
    return;
  }
  if (!(await SecureStore.isAvailableAsync())) return;
  const opts = secureOpts();
  try {
    await SecureStore.deleteItemAsync(KEY_ACCESS_LEGACY, opts);
  } catch {
    /* already gone */
  }
}

/**
 * Hydrate in-memory access token from verify/refresh: refresh → SecureStore,
 * access → Zustand only.
 */
export async function saveAuthSession(tokens: VerifyOtpResponse): Promise<void> {
  const storedAt = Date.now();
  const meta: SessionMeta = {
    expiresIn: tokens.expiresIn,
    tokenType: tokens.tokenType,
    storedAt,
  };
  const metaJson = JSON.stringify(meta);
  if (USE_WEB_AUTH_STORAGE) {
    persistRefreshBundleWeb(tokens.refreshToken, metaJson);
  } else {
    await persistRefreshBundleNative(tokens.refreshToken, metaJson);
  }
  useAuthSessionStore.getState().setFromTokenPair(tokens);
  void clearLegacyAccessKey();
}

export async function clearAuthSession(): Promise<void> {
  useAuthSessionStore.getState().clear();
  if (USE_WEB_AUTH_STORAGE) {
    try {
      if (typeof localStorage !== 'undefined') {
        for (const key of [KEY_ACCESS_LEGACY, KEY_REFRESH, KEY_META]) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      /* ignore */
    }
    return;
  }
  if (!(await SecureStore.isAvailableAsync())) return;
  const opts = secureOpts();
  for (const key of [KEY_ACCESS_LEGACY, KEY_REFRESH, KEY_META]) {
    try {
      await SecureStore.deleteItemAsync(key, opts);
    } catch {
      /* already gone */
    }
  }
}

/** Whether a refresh token exists on disk (signed-in, pending in-memory bootstrap). */
export async function hasAuthSession(): Promise<boolean> {
  try {
    const refresh = await getStoredRefreshToken();
    return Boolean(refresh);
  } catch {
    return false;
  }
}

export async function getStoredRefreshToken(): Promise<string | null> {
  try {
    if (USE_WEB_AUTH_STORAGE) {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem(KEY_REFRESH);
    }
    if (!(await SecureStore.isAvailableAsync())) return null;
    return await SecureStore.getItemAsync(KEY_REFRESH, secureOpts());
  } catch {
    return null;
  }
}

/**
 * Combined view: refresh from SecureStore + access from memory. `null` if the
 * user is not fully hydrated (e.g. before `bootstrapAuthSession` completes).
 */
export async function getStoredAuthPayload(): Promise<StoredAuthPayload | null> {
  const accessToken = useAuthSessionStore.getState().accessToken;
  const refreshToken = await getStoredRefreshToken();
  if (!accessToken || !refreshToken) return null;
  try {
    let metaRaw: string | null;
    if (USE_WEB_AUTH_STORAGE) {
      if (typeof localStorage === 'undefined') return null;
      metaRaw = localStorage.getItem(KEY_META);
    } else {
      if (!(await SecureStore.isAvailableAsync())) return null;
      metaRaw = await SecureStore.getItemAsync(KEY_META, secureOpts());
    }
    if (!metaRaw) return null;
    const meta = JSON.parse(metaRaw) as SessionMeta;
    return {
      accessToken,
      refreshToken,
      expiresIn: meta.expiresIn,
      tokenType: meta.tokenType,
      storedAt: meta.storedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Cold start: if a refresh token exists but memory has no access JWT, call
 * `/v1/auth/refresh` once to populate the in-memory access token and rotate
 * refresh on disk. Returns whether the user should be treated as signed in.
 */
export async function bootstrapAuthSession(): Promise<boolean> {
  await clearLegacyAccessKey();
  const refresh = await getStoredRefreshToken();
  if (!refresh) {
    useAuthSessionStore.getState().clear();
    return false;
  }
  if (useAuthSessionStore.getState().accessToken) {
    return true;
  }
  try {
    const next = await refreshTokens({ refreshToken: refresh });
    await saveAuthSession(next);
    return true;
  } catch {
    await clearAuthSession();
    return false;
  }
}

/**
 * Calls `POST /v1/auth/refresh` with the stored refresh token and replaces the
 * refresh token on disk + access token in memory.
 *
 * On `TOKEN_REUSED` / `REFRESH_TOKEN_EXPIRED` etc., callers should catch
 * `ApiError`, clear the session, and send the user back to login.
 */
export async function refreshStoredSession(): Promise<VerifyOtpResponse> {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token in secure storage.');
  }
  const next = await refreshTokens({ refreshToken });
  await saveAuthSession(next);
  notifySessionTokensRefreshed();
  return next;
}

/**
 * Calls `POST /v1/auth/logout` to revoke the refresh token, then clears local
 * storage + memory. Server revoke is best-effort — local wipe always runs so the
 * user cannot stay “stuck” signed in when offline.
 */
export async function signOut(): Promise<void> {
  const refreshToken = await getStoredRefreshToken();
  if (refreshToken) {
    try {
      await logout({ refreshToken });
    } catch {
      /* Idempotent on server; ignore network / already-revoked */
    }
  }
  await clearAuthSession();
}
