import type { AuthMeData } from '@/features/auth/types/auth.types';
import { SIGNED_IN_PATHS, type SignedInPath } from '@/features/onboarding/constants/signedInPaths';
import {
  isAvatarStepOnboardingComplete,
  isDisplayNameOnboardingComplete,
  isNameStepOnboardingComplete,
} from '@/features/onboarding/services/displayNameOnboardingFlag';

type Args = {
  accessToken: string | null | undefined;
  /** `null` only when `/auth/me` is unavailable (network) or not fetched yet. */
  me: AuthMeData | null;
  /**
   * Prefer MMKV when the server profile is unknown (e.g. `getAuthMe` failed).
   */
  useOfflineFallback: boolean;
};

/**
 * Canonical next route for a signed-in session. **Server state wins** when `me` is present;
 * offline fall back uses the name → avatar → use-case → home chain.
 */
export function resolveSignedInPath({ accessToken, me, useOfflineFallback }: Args): SignedInPath {
  if (!accessToken) {
    return SIGNED_IN_PATHS.LOGIN;
  }

  if (me?.onboarding?.isOnboardingComplete) {
    return SIGNED_IN_PATHS.HOME;
  }

  if (me) {
    const o = me.onboarding;
    if (!o?.hasDisplayName) {
      return SIGNED_IN_PATHS.ONBOARDING_NAME;
    }
    /* User may skip avatar on-device without `avatarUrl`; honour MMKV so use-case is reachable. */
    if (!o?.hasAvatar && !isAvatarStepOnboardingComplete(accessToken)) {
      return SIGNED_IN_PATHS.ONBOARDING_AVATAR;
    }
    if (!o?.hasUseCase) {
      return SIGNED_IN_PATHS.ONBOARDING_USE_CASE;
    }
    return SIGNED_IN_PATHS.HOME;
  }

  if (!useOfflineFallback) {
    return SIGNED_IN_PATHS.ONBOARDING_NAME;
  }

  if (isDisplayNameOnboardingComplete(accessToken)) {
    return SIGNED_IN_PATHS.HOME;
  }
  if (isAvatarStepOnboardingComplete(accessToken)) {
    return SIGNED_IN_PATHS.ONBOARDING_USE_CASE;
  }
  if (isNameStepOnboardingComplete(accessToken)) {
    return SIGNED_IN_PATHS.ONBOARDING_AVATAR;
  }
  return SIGNED_IN_PATHS.ONBOARDING_NAME;
}
