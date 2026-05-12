/**
 * Wire-level types for the OTP endpoints. Keep these small + serialisable —
 * derived/computed fields (countdowns, masked phone) live in the store.
 */

export type SendOtpRequest = {
  /** E.164 phone, e.g. `+919876543210`. Must be normalised by the caller. */
  phoneE164: string;
  /** Optional cancellation signal. Forwarded to `apiFetch`. */
  signal?: AbortSignal;
};

export type SendOtpResponse = {
  /** UUID v4. Pass to `/v1/otp/verify`. */
  sessionId: string;
  /** Absolute ms-epoch deadline after which the OTP is invalid. */
  expiresAt: number;
  /** Server-authoritative resend cooldown, in seconds. */
  retryAfter: number;
};

export type VerifyOtpRequest = {
  sessionId: string;
  /** Exactly six digits, server matches `^\d{6}$`. */
  otp: string;
  /**
   * One unique key per verify attempt (max 64 chars). Same key may repeat only
   * when retrying the identical request (e.g. network replay).
   */
  idempotencyKey: string;
  signal?: AbortSignal;
};

export type VerifyOtpResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
};

/**
 * Server-defined OTP error codes for `/v1/otp/send` and `/v1/otp/verify`.
 *
 * NEVER hardcode these strings elsewhere. Import from this enum so renames
 * propagate via TS, not grep.
 */
export const OTP_ERROR_CODES = {
  // /v1/otp/send
  COOLDOWN_ACTIVE: 'COOLDOWN_ACTIVE',
  RATE_LIMITED_PHONE: 'RATE_LIMITED_PHONE',
  RATE_LIMITED_IP: 'RATE_LIMITED_IP',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  // /v1/otp/verify
  IDEMPOTENCY_KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  IDEMPOTENCY_KEY_INVALID: 'IDEMPOTENCY_KEY_INVALID',
  INVALID_OTP: 'INVALID_OTP',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  OTP_EXPIRED: 'OTP_EXPIRED',
  SESSION_LOCKED: 'SESSION_LOCKED',
  VERIFY_RATE_LIMITED: 'VERIFY_RATE_LIMITED',
  MAX_ATTEMPTS: 'MAX_ATTEMPTS',
} as const;

export type OtpErrorCode = (typeof OTP_ERROR_CODES)[keyof typeof OTP_ERROR_CODES];
