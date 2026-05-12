import { decodeJwtPayloadUnsafe } from '@/utils/decodeJwtPayload';

/** Matches auth-service access-token payload + optional future `name` claims. */
export type QismaAccessTokenClaims = {
  sub?: string;
  identifier?: string;
  type?: string;
  name?: string;
  preferred_username?: string;
};

/**
 * Fallback when **`GET /v1/auth/me`** is not available yet: JWT `name` /
 * `preferred_username`, then optional `EXPO_PUBLIC_WELCOME_DISPLAY_NAME`.
 *
 * Does **not** invent a default name in dev — without claims, returns `null` so UI can
 * show **Welcome to Qisma!** until `/auth/me` returns `name`.
 */
export function getWelcomeDisplayNameFromAccessToken(accessToken: string): string | null {
  const claims = decodeJwtPayloadUnsafe<QismaAccessTokenClaims>(accessToken);
  const fromClaims = claims?.name?.trim() || claims?.preferred_username?.trim();
  if (fromClaims) return fromClaims;

  const fromEnv = process.env.EXPO_PUBLIC_WELCOME_DISPLAY_NAME?.trim();
  if (fromEnv) return fromEnv;

  return null;
}
