import { ApiError, CLIENT_ERROR_CODES } from '@/api';

import { OTP_ERROR_CODES } from '../types/otp.types';

/**
 * UI-shaped error produced from any `apiFetch` failure on the auth service.
 *
 *   - `code`       — stable enum-ish string for switching UI behaviour.
 *   - `messageKey` — i18n key for the user-facing copy.
 *   - `retryAfter` — seconds; 0 when the server didn't suggest one.
 *   - `severity`   — `expected` (validation, cooldown, rate limit) → quiet.
 *                    `unexpected` (5xx, drift, parse) → log to Sentry.
 *
 * NEVER surface the raw server `message` in production. The mapping table
 * below is the contract; the server message is for your dashboards only.
 */
export type UiAuthError = {
  code: string;
  messageKey: string;
  retryAfter: number;
  severity: 'expected' | 'unexpected';
};

type AuthFlow = 'send' | 'verify';

type ErrorMapping = Record<string, { messageKey: string; severity: UiAuthError['severity'] }>;

const SEND_SIDE_MAP: ErrorMapping = {
  // Server, /v1/otp/send
  [OTP_ERROR_CODES.COOLDOWN_ACTIVE]: {
    messageKey: 'auth.phone.errors.cooldown',
    severity: 'expected',
  },
  [OTP_ERROR_CODES.RATE_LIMITED_PHONE]: {
    messageKey: 'auth.phone.errors.rateLimitedPhone',
    severity: 'expected',
  },
  [OTP_ERROR_CODES.RATE_LIMITED_IP]: {
    messageKey: 'auth.phone.errors.rateLimitedIp',
    severity: 'expected',
  },
  // VALIDATION_ERROR is `unexpected` because we MUST validate client-side
  // first. Hitting this means the validator drifted from the server regex
  // → log it as a contract bug, not a user-facing nuisance.
  [OTP_ERROR_CODES.VALIDATION_ERROR]: {
    messageKey: 'auth.phone.errors.validation',
    severity: 'unexpected',
  },
  [OTP_ERROR_CODES.INTERNAL_ERROR]: {
    messageKey: 'auth.phone.errors.internal',
    severity: 'unexpected',
  },

  // Client-side codes from `apiFetch`
  [CLIENT_ERROR_CODES.NETWORK_ERROR]: {
    messageKey: 'auth.phone.errors.network',
    severity: 'expected',
  },
  [CLIENT_ERROR_CODES.TIMEOUT]: {
    messageKey: 'auth.phone.errors.timeout',
    severity: 'expected',
  },
  [CLIENT_ERROR_CODES.PARSE_ERROR]: {
    messageKey: 'auth.phone.errors.internal',
    severity: 'unexpected',
  },
  [CLIENT_ERROR_CODES.CANCELLED]: {
    messageKey: 'auth.phone.errors.unknown',
    severity: 'expected',
  },
  [CLIENT_ERROR_CODES.UNKNOWN_ERROR]: {
    messageKey: 'auth.phone.errors.unknown',
    severity: 'unexpected',
  },
};

const VERIFY_SIDE_MAP: ErrorMapping = {
  // Server, /v1/otp/verify
  [OTP_ERROR_CODES.INVALID_OTP]: {
    messageKey: 'auth.verify.errors.invalidOtp',
    severity: 'expected',
  },
  [OTP_ERROR_CODES.SESSION_NOT_FOUND]: {
    messageKey: 'auth.verify.errors.sessionNotFound',
    severity: 'expected',
  },
  [OTP_ERROR_CODES.OTP_EXPIRED]: {
    messageKey: 'auth.verify.errors.otpExpired',
    severity: 'expected',
  },
  [OTP_ERROR_CODES.SESSION_LOCKED]: {
    messageKey: 'auth.verify.errors.sessionLocked',
    severity: 'expected',
  },
  [OTP_ERROR_CODES.VERIFY_RATE_LIMITED]: {
    messageKey: 'auth.verify.errors.verifyRateLimited',
    severity: 'expected',
  },
  [OTP_ERROR_CODES.MAX_ATTEMPTS]: {
    messageKey: 'auth.verify.errors.maxAttempts',
    severity: 'expected',
  },
  [OTP_ERROR_CODES.IDEMPOTENCY_CONFLICT]: {
    messageKey: 'auth.verify.errors.idempotencyConflict',
    severity: 'expected',
  },
  [OTP_ERROR_CODES.IDEMPOTENCY_KEY_REQUIRED]: {
    messageKey: 'auth.verify.errors.internal',
    severity: 'unexpected',
  },
  [OTP_ERROR_CODES.IDEMPOTENCY_KEY_INVALID]: {
    messageKey: 'auth.verify.errors.internal',
    severity: 'unexpected',
  },
  [OTP_ERROR_CODES.VALIDATION_ERROR]: {
    messageKey: 'auth.verify.errors.validation',
    severity: 'unexpected',
  },
  [OTP_ERROR_CODES.INTERNAL_ERROR]: {
    messageKey: 'auth.verify.errors.internal',
    severity: 'unexpected',
  },

  [CLIENT_ERROR_CODES.NETWORK_ERROR]: {
    messageKey: 'auth.verify.errors.network',
    severity: 'expected',
  },
  [CLIENT_ERROR_CODES.TIMEOUT]: {
    messageKey: 'auth.verify.errors.timeout',
    severity: 'expected',
  },
  [CLIENT_ERROR_CODES.PARSE_ERROR]: {
    messageKey: 'auth.verify.errors.internal',
    severity: 'unexpected',
  },
  [CLIENT_ERROR_CODES.CANCELLED]: {
    messageKey: 'auth.verify.errors.unknown',
    severity: 'expected',
  },
  [CLIENT_ERROR_CODES.UNKNOWN_ERROR]: {
    messageKey: 'auth.verify.errors.unknown',
    severity: 'unexpected',
  },
};

const UNKNOWN_MESSAGE_KEY: Record<AuthFlow, string> = {
  send: 'auth.phone.errors.unknown',
  verify: 'auth.verify.errors.unknown',
};

export function parseAuthServiceError(error: unknown, flow: AuthFlow = 'send'): UiAuthError {
  if (error instanceof ApiError) {
    const map = flow === 'send' ? SEND_SIDE_MAP : VERIFY_SIDE_MAP;
    const mapped = map[error.code];
    if (mapped) {
      return {
        code: error.code,
        messageKey: mapped.messageKey,
        retryAfter: error.retryAfter ?? 0,
        severity: mapped.severity,
      };
    }
    // Unknown server `code` — contract drift. Treat as unexpected so it
    // gets reported, but render generic copy.
    return {
      code: error.code,
      messageKey: UNKNOWN_MESSAGE_KEY[flow],
      retryAfter: error.retryAfter ?? 0,
      severity: 'unexpected',
    };
  }

  // Non-ApiError reaching here = programmer bug (e.g. JSON.parse in a hook).
  // Don't pretend we know what it is.
  return {
    code: CLIENT_ERROR_CODES.UNKNOWN_ERROR,
    messageKey: UNKNOWN_MESSAGE_KEY[flow],
    retryAfter: 0,
    severity: 'unexpected',
  };
}
