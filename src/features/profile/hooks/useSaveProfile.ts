import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { ApiError, CLIENT_ERROR_CODES } from '@/api';
import type { UpdateProfileRequest } from '@/features/auth/api/authApi';
import { updateProfile, uploadAvatar } from '@/features/auth/api/authApi';
import { setAuthMeCacheFromPatch } from '@/features/auth/services/authMeCache';
import { refreshStoredSession } from '@/features/auth/services/authSession';
import { mapUpdateProfileError } from '@/features/onboarding/api/mapUpdateProfileError';
import { logger } from '@/services';

export type PickedAvatarAsset = {
  uri: string;
  fileName: string;
  mimeType: string;
};

export type SaveProfilePatch = {
  name?: string;
  pickedAvatar?: PickedAvatarAsset;
};

/**
 * `PATCH /v1/auth/me` after optional `POST /v1/upload/avatar`.
 * Callers dismiss the screen after `mutateAsync` resolves.
 */
export function useSaveProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: SaveProfilePatch): Promise<void> => {
      const body: UpdateProfileRequest = {};
      if (patch.pickedAvatar) {
        const { url } = await uploadAvatar({
          uri: patch.pickedAvatar.uri,
          fileName: patch.pickedAvatar.fileName,
          mimeType: patch.pickedAvatar.mimeType,
        });
        body.avatarUrl = url;
      }
      if (patch.name !== undefined) body.name = patch.name.trim();

      if (body.name === undefined && body.avatarUrl === undefined) {
        throw new ApiError({
          code: CLIENT_ERROR_CODES.UNKNOWN_ERROR,
          message: 'No profile changes',
          status: 0,
        });
      }

      const profile = await updateProfile(body);
      setAuthMeCacheFromPatch(queryClient, profile);
      try {
        await refreshStoredSession();
      } catch (e) {
        logger.captureException(e, { tags: { phase: 'refresh-after-profile-edit' } });
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },

    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.code === CLIENT_ERROR_CODES.NETWORK_ERROR) {
        return failureCount < 1;
      }
      return false;
    },

    retryDelay: () => 200 + Math.random() * 200,

    onError: (error) => {
      const ui = mapUpdateProfileError(error);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      if (ui.severity === 'unexpected') {
        logger.captureException(error, {
          endpoint: '/v1/upload/avatar|/v1/auth/me',
          errorCode: ui.code,
          requestId: error instanceof ApiError ? error.requestId : undefined,
        });
      }
    },
  });
}
