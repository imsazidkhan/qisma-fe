import type { VerifyOtpResponse } from './otp.types';

/**
 * JWT bundle returned by `/v1/otp/verify` and `/v1/auth/refresh` — identical
 * envelope (`accessToken`, `refreshToken`, `expiresIn`, `tokenType`).
 */
export type AuthTokenPair = VerifyOtpResponse;

/** Success payload from `POST /v1/auth/logout`. */
export type LogoutResponse = {
  message: string;
};

/** Profile returned by `PATCH /v1/auth/me` / `GET /v1/auth/me`. */
export type UserProfile = {
  id: string;
  identifier: string;
  name: string | null;
  avatarUrl: string | null;
  /** `PATCH /v1/auth/me` `{ useCase }` — null until set. */
  useCase?: string | null;
  /** Set when onboarding is marked complete — null until then (ISO string in JSON). */
  onboardingCompletedAt?: string | null;
  phoneVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

/** Derived server hints for onboarding routing (`GET /v1/auth/me`). */
export type OnboardingStatus = {
  hasDisplayName: boolean;
  hasAvatar: boolean;
  hasUseCase?: boolean;
  isOnboardingComplete?: boolean;
};

/** `GET /v1/auth/me` — profile plus `onboarding` (ISO date strings in JSON). */
export type AuthMeData = UserProfile & {
  onboarding: OnboardingStatus;
};

/** Stable codes from `POST /v1/auth/refresh` error envelope (`error.code`). */
export const AUTH_ERROR_CODES = {
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
  REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',
  REFRESH_TOKEN_REQUIRED: 'REFRESH_TOKEN_REQUIRED',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  TOKEN_REUSED: 'TOKEN_REUSED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DISPLAY_NAME_INVALID: 'DISPLAY_NAME_INVALID',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  AVATAR_FILE_TYPE_INVALID: 'AVATAR_FILE_TYPE_INVALID',
  AVATAR_FILE_REQUIRED: 'AVATAR_FILE_REQUIRED',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
