import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_PRODUCTION_API_ORIGIN = 'https://qisma-be.onrender.com';

/**
 * Resolves the auth-service base URL (already includes the `/v1` global prefix
 * — see `auth-service/src/main.ts`).
 *
 * Resolution order:
 *   1. `EXPO_PUBLIC_API_BASE_URL` when set. If you pass an **origin only**
 *      (e.g. `http://192.168.1.5:3000`), `/v1` is appended automatically —
 *      auth-service routes all APIs under `/v1`.
 *   2. Release without that env → hosted default (`DEFAULT_PRODUCTION_API_ORIGIN`).
 *   3. Dev without that env → host derived from simulator / emulator / Expo `hostUri`:
 *      - iOS Simulator  → `http://localhost:3000/v1`
 *      - Android Emulator → `http://10.0.2.2:3000/v1` (the emulator's loopback alias)
 *      - Physical device → derive from Expo's `hostUri` so the LAN IP is used.
 *      - Web → `http://localhost:3000/v1`
 *
 * **Browser / Expo Web:** enable auth-service CORS for Qisma client headers; if you use
 * explicit `CORS_ORIGINS` on the API, include `http://localhost:8081` (and your LAN IP for devices).
 */
export function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) return ensureAuthServiceV1Base(fromEnv);

  if (!__DEV__) {
    return ensureAuthServiceV1Base(DEFAULT_PRODUCTION_API_ORIGIN);
  }

  const port = 3000;

  if (Platform.OS === 'android') {
    // Emulator first — works without LAN config. Physical devices need the LAN IP
    // (use the Expo hostUri fallback below).
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.hostUri;
    const lanHost = hostUri?.split(':')[0];
    if (lanHost && lanHost !== 'localhost' && lanHost !== '127.0.0.1') {
      return `http://${lanHost}:${port}/v1`;
    }
    return `http://10.0.2.2:${port}/v1`;
  }

  if (Platform.OS === 'ios') {
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.hostUri;
    const lanHost = hostUri?.split(':')[0];
    if (lanHost && lanHost !== 'localhost' && lanHost !== '127.0.0.1') {
      return `http://${lanHost}:${port}/v1`;
    }
    return `http://localhost:${port}/v1`;
  }

  return `http://localhost:${port}/v1`;
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/**
 * Nest auth-service uses `setGlobalPrefix('v1')`. Hitting the origin without
 * `/v1` yields 404 JSON like `{ statusCode, message }` — not our `{ success, data }`
 * envelope — and the client surfaces a confusing PARSE_ERROR.
 */
function ensureAuthServiceV1Base(url: string): string {
  const trimmed = stripTrailingSlash(url);
  if (trimmed.endsWith('/v1')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    const path = parsed.pathname;
    if (path === '/' || path === '') {
      return `${trimmed}/v1`;
    }
  } catch {
    /* malformed URL — return trimmed; fetch will fail with a clearer network error */
  }
  return trimmed;
}
