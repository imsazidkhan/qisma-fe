import { ApiError, CLIENT_ERROR_CODES } from '@/api';

import { AUTH_ERROR_CODES } from '@/features/auth/types';
import { AUTH_AVATAR } from '@/i18n/strings/avatarAuth';
import { AUTH_DISPLAY_NAME } from '@/i18n/strings/displayNameAuth';

export type UiUpdateProfileError = {
  code: string;
  severity: 'expected' | 'unexpected';
  /** i18n key when `validationDetail` is absent. */
  messageKey: string;
  /** Same copy as English bundle; used as `t(..., { defaultValue })` when lookup fails. */
  fallbackMessage: string;
  /** First server validation detail for `VALIDATION_ERROR` (when present). */
  validationDetail?: string;
};

const E = AUTH_DISPLAY_NAME.errors;
const AE = AUTH_AVATAR.errors;

const SESSION_CODES = new Set(['UNAUTHORIZED', 'TOKEN_EXPIRED', 'INVALID_TOKEN']);

const PROFILE_MAP: Record<
  string,
  {
    messageKey: string;
    severity: UiUpdateProfileError['severity'];
    fallbackMessage: string;
  }
> = {
  [AUTH_ERROR_CODES.DISPLAY_NAME_INVALID]: {
    messageKey: 'auth.displayName.errors.displayNameInvalid',
    severity: 'expected',
    fallbackMessage: E.displayNameInvalid,
  },
  [AUTH_ERROR_CODES.AVATAR_FILE_TYPE_INVALID]: {
    messageKey: 'auth.avatar.errors.fileType',
    severity: 'expected',
    fallbackMessage: AE.fileType,
  },
  [AUTH_ERROR_CODES.AVATAR_FILE_REQUIRED]: {
    messageKey: 'auth.avatar.errors.fileRequired',
    severity: 'expected',
    fallbackMessage: AE.fileRequired,
  },
  [AUTH_ERROR_CODES.ACCOUNT_INACTIVE]: {
    messageKey: 'auth.displayName.errors.accountInactive',
    severity: 'expected',
    fallbackMessage: E.accountInactive,
  },
  [AUTH_ERROR_CODES.USER_NOT_FOUND]: {
    messageKey: 'auth.displayName.errors.userNotFound',
    severity: 'expected',
    fallbackMessage: E.userNotFound,
  },
  [CLIENT_ERROR_CODES.NETWORK_ERROR]: {
    messageKey: 'auth.displayName.errors.retry',
    severity: 'expected',
    fallbackMessage: E.retry,
  },
  [CLIENT_ERROR_CODES.TIMEOUT]: {
    messageKey: 'auth.displayName.errors.retry',
    severity: 'expected',
    fallbackMessage: E.retry,
  },
  [CLIENT_ERROR_CODES.CANCELLED]: {
    messageKey: 'auth.displayName.errors.unknown',
    severity: 'expected',
    fallbackMessage: E.unknown,
  },
  [CLIENT_ERROR_CODES.PARSE_ERROR]: {
    messageKey: 'auth.displayName.errors.unknown',
    severity: 'unexpected',
    fallbackMessage: E.unknown,
  },
  [CLIENT_ERROR_CODES.UNKNOWN_ERROR]: {
    messageKey: 'auth.displayName.errors.unknown',
    severity: 'unexpected',
    fallbackMessage: E.unknown,
  },
  [AUTH_ERROR_CODES.INTERNAL_ERROR]: {
    messageKey: 'auth.displayName.errors.unknown',
    severity: 'unexpected',
    fallbackMessage: E.unknown,
  },
};

export function mapUpdateProfileError(error: unknown): UiUpdateProfileError {
  const unknownFb: UiUpdateProfileError = {
    code: CLIENT_ERROR_CODES.UNKNOWN_ERROR,
    messageKey: 'auth.displayName.errors.unknown',
    fallbackMessage: E.unknown,
    severity: 'unexpected',
  };

  if (!(error instanceof ApiError)) {
    return unknownFb;
  }

  if (SESSION_CODES.has(error.code)) {
    return {
      code: error.code,
      messageKey: 'auth.displayName.errors.session',
      fallbackMessage: E.session,
      severity: 'expected',
    };
  }

  if (error.code === AUTH_ERROR_CODES.VALIDATION_ERROR) {
    return {
      code: error.code,
      messageKey: 'auth.displayName.errors.validationFallback',
      fallbackMessage: E.validationFallback,
      validationDetail: error.details?.[0],
      severity: 'expected',
    };
  }

  const mapped = PROFILE_MAP[error.code];
  if (mapped) {
    return {
      code: error.code,
      messageKey: mapped.messageKey,
      fallbackMessage: mapped.fallbackMessage,
      severity: mapped.severity,
    };
  }

  return {
    code: error.code,
    messageKey: 'auth.displayName.errors.unknown',
    fallbackMessage: E.unknown,
    severity: 'unexpected',
  };
}
