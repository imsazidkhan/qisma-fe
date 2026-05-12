import type { QueryClient } from '@tanstack/react-query';

import { authQueryKeys } from '@/features/auth/queryKeys';

import type { AuthMeData, OnboardingStatus, UserProfile } from '../types/auth.types';

/**
 * Matches auth-service onboarding hints derived from persisted user columns
 * (`auth.controller.ts` `userToMeData`).
 */
export function deriveOnboardingFromProfile(profile: UserProfile): OnboardingStatus {
  return {
    hasDisplayName: Boolean(profile.name?.trim()),
    hasAvatar: Boolean(profile.avatarUrl?.trim()),
    hasUseCase: Boolean(profile.useCase?.trim()),
    isOnboardingComplete: profile.onboardingCompletedAt != null,
  };
}

export function mergeAuthMeFromPatch(
  previous: AuthMeData | undefined,
  profile: UserProfile,
): AuthMeData {
  const onboarding = deriveOnboardingFromProfile(profile);
  if (!previous) {
    return { ...profile, onboarding };
  }
  return { ...previous, ...profile, onboarding };
}

/**
 * Updates **`GET /v1/auth/me`** cache after a successful `PATCH /v1/auth/me` payload,
 * avoiding an immediate refetch storm.
 */
export function setAuthMeCacheFromPatch(queryClient: QueryClient, profile: UserProfile): void {
  queryClient.setQueryData<AuthMeData>(authQueryKeys.me, (previous) =>
    mergeAuthMeFromPatch(previous, profile),
  );
}
