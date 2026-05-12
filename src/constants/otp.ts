/**
 * Mirror of the server-side OTP constants. When the backend changes any of
 * these, change them HERE in the same PR — UX copy and timer math derive
 * from this file. If a value drifts, screens lie to the user.
 *
 * Source of truth: `auth-service` config. Keep this list short & terse.
 */
export const OTP = {
  /** Length of the numeric code (digits). */
  CODE_LENGTH: 6,
  /** OTP time-to-live, seconds. Drives the on-screen expiry countdown. */
  TTL_SECONDS: 5 * 60,
  /** Resend cooldown, seconds. Mirrors the default `retryAfter` returned on /send. */
  RESEND_COOLDOWN_SECONDS: 60,
  /** Max wrong code attempts before the session is locked. */
  MAX_VERIFY_ATTEMPTS: 5,
  /** Lock duration after MAX_VERIFY_ATTEMPTS, seconds. */
  LOCK_DURATION_SECONDS: 15 * 60,
  /** Per-phone /send rate limit (requests per minute). */
  SEND_RATE_PER_PHONE_PER_MIN: 5,
  /** Per-IP /send rate limit (requests per minute). */
  SEND_RATE_PER_IP_PER_MIN: 10,
  /** Per-session /verify rate limit (requests per minute). */
  VERIFY_RATE_PER_SESSION_PER_MIN: 10,
} as const;

/**
 * Default region used by phone validation / normalisation. Extend by adding
 * an entry to `PHONE_REGIONS` in `@/utils/phone.ts` and switching this.
 */
export const DEFAULT_PHONE_REGION = 'IN' as const;
