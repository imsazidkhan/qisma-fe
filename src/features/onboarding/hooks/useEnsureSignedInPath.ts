import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
import { useAuthSessionStore } from '@/features/auth/store/useAuthSessionStore';
import type { SignedInPath } from '@/features/onboarding/constants/signedInPaths';
import { SIGNED_IN_PATHS } from '@/features/onboarding/constants/signedInPaths';
import { resolveSignedInPath } from '@/features/onboarding/services/resolveSignedInPath';

/**
 * Redirects when the user is on the wrong onboarding / home screen for their
 * current session (from `GET /v1/auth/me` when available, else MMKV).
 *
 * **`/home`** does not bounce away purely because `/auth/me` failed — degraded offline home is allowed.
 */
export function useEnsureSignedInPath(allowedPath: SignedInPath): void {
  const router = useRouter();
  const accessToken = useAuthSessionStore((s) => s.accessToken);
  const { data: me, isPending, isError } = useAuthMe();

  useEffect(() => {
    if (!accessToken) {
      router.replace(SIGNED_IN_PATHS.LOGIN as Href);
      return;
    }

    if (allowedPath === SIGNED_IN_PATHS.HOME && isError) {
      return;
    }

    const stillBootstrapping = isPending && me === undefined && !isError;
    if (stillBootstrapping) {
      return;
    }

    const useOfflineFallback = isError || (me === undefined && !isPending);
    const resolved = resolveSignedInPath({
      accessToken,
      me: me ?? null,
      useOfflineFallback,
    });

    if (resolved !== allowedPath) {
      router.replace(resolved as Href);
    }
  }, [accessToken, allowedPath, isError, isPending, me, router]);
}
