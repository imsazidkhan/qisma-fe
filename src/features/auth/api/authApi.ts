import { Platform } from 'react-native';

import { ApiError, apiFetch, CLIENT_ERROR_CODES, ENDPOINTS } from '@/api';

import type { AuthMeData, AuthTokenPair, LogoutResponse, UserProfile } from '../types/auth.types';

export type RefreshTokensRequest = {
  /** Current refresh JWT from the last verify or refresh response. */
  refreshToken: string;
  signal?: AbortSignal;
};

export type LogoutRequest = {
  refreshToken: string;
  signal?: AbortSignal;
};

/** Matches `PATCH /v1/auth/me` body — at least one field required by server. */
export type UpdateProfileRequest = {
  name?: string;
  avatarUrl?: string;
  useCase?: string;
  onboardingCompleted?: boolean;
  signal?: AbortSignal;
};

/**
 * `POST /v1/auth/refresh` — rotate refresh token; returns a **new** access +
 * refresh pair. The previous refresh token becomes invalid (single-use).
 */
export function refreshTokens({
  refreshToken,
  signal,
}: RefreshTokensRequest): Promise<AuthTokenPair> {
  return apiFetch<AuthTokenPair>(ENDPOINTS.auth.refresh, {
    method: 'POST',
    body: { refreshToken },
    signal,
    skipAuth: true,
  });
}

/**
 * `POST /v1/auth/logout` — revoke the refresh token server-side (idempotent).
 */
export function logout({ refreshToken, signal }: LogoutRequest): Promise<LogoutResponse> {
  return apiFetch<LogoutResponse>(ENDPOINTS.auth.logout, {
    method: 'POST',
    body: { refreshToken },
    signal,
    skipAuth: true,
  });
}

/**
 * `GET /v1/auth/me` — current user + onboarding hints (requires access token).
 */
export function getAuthMe(signal?: AbortSignal): Promise<AuthMeData> {
  return apiFetch<AuthMeData>(ENDPOINTS.auth.me, {
    method: 'GET',
    signal,
  });
}

/**
 * `PATCH /v1/auth/me` — profile fields (requires access token).
 */
export function updateProfile({
  name,
  avatarUrl,
  useCase,
  onboardingCompleted,
  signal,
}: UpdateProfileRequest): Promise<UserProfile> {
  const body: Record<string, string | boolean> = {};
  if (name !== undefined) body.name = name;
  if (avatarUrl !== undefined) body.avatarUrl = avatarUrl;
  if (useCase !== undefined) body.useCase = useCase;
  if (onboardingCompleted !== undefined) body.onboardingCompleted = onboardingCompleted;
  return apiFetch<UserProfile>(ENDPOINTS.auth.me, {
    method: 'PATCH',
    body,
    signal,
  });
}

export type AvatarUploadResponse = {
  /** Public URL for `PATCH /v1/auth/me` { avatarUrl }. */
  url: string;
};

export type UploadAvatarRequest = {
  /** RN image picker asset / file URI. */
  uri: string;
  fileName: string;
  mimeType: string;
  signal?: AbortSignal;
};

/**
 * `POST /v1/upload/avatar` — multipart field `file` (requires access token).
 *
 * **Web:** browsers need a real `File`/`Blob`; RN’s `{ uri, name, type }` becomes `[object Object]`.
 * **Native:** unchanged React Native FormData shape.
 */
export async function uploadAvatar({
  uri,
  fileName,
  mimeType,
  signal,
}: UploadAvatarRequest): Promise<AvatarUploadResponse> {
  const form = new FormData();

  if (Platform.OS === 'web') {
    const res = await fetch(uri, { signal });
    if (!res.ok) {
      throw new ApiError({
        code: CLIENT_ERROR_CODES.UNKNOWN_ERROR,
        message: 'Could not read the selected image. Try again.',
        status: res.status,
      });
    }
    const blob = await res.blob();
    const type = mimeType || blob.type || 'image/jpeg';
    if (typeof File !== 'undefined') {
      form.append('file', new File([blob], fileName, { type }));
    } else {
      form.append('file', blob, fileName);
    }
  } else {
    form.append('file', { uri, name: fileName, type: mimeType } as unknown as Blob);
  }

  return apiFetch<AvatarUploadResponse>(ENDPOINTS.upload.avatar, {
    method: 'POST',
    body: form,
    signal,
    timeoutMs: 60_000,
  });
}
