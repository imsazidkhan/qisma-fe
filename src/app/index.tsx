import * as SplashScreen from 'expo-splash-screen';
import { Redirect, type Href } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { getAuthMe } from '@/features/auth/api/authApi';
import { authQueryKeys } from '@/features/auth/queryKeys';
import { bootstrapAuthSession } from '@/features/auth/services/authSession';
import { useAuthSessionStore } from '@/features/auth/store/useAuthSessionStore';
import type { AuthMeData } from '@/features/auth/types/auth.types';
import { resolveSignedInPath } from '@/features/onboarding/services/resolveSignedInPath';

void SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Entry redirect: hydrate session via refresh when needed. **`GET /v1/auth/me`** drives onboarding
 * when reachable; offline uses MMKV (name → avatar → use-case → home).
 */
export default function RootIndex() {
  const queryClient = useQueryClient();
  const [href, setHref] = useState<Href | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const authed = await bootstrapAuthSession();
        if (!authed) {
          setHref('/login');
          return;
        }

        const accessToken = useAuthSessionStore.getState().accessToken;
        let me: AuthMeData | null = null;
        try {
          me = await queryClient.fetchQuery({
            queryKey: authQueryKeys.me,
            queryFn: ({ signal }) => getAuthMe(signal),
          });
        } catch {
          /* keep me null → offline resolver */
        }

        const next = resolveSignedInPath({
          accessToken,
          me,
          useOfflineFallback: me === null,
        });
        setHref(next as Href);
      } finally {
        await SplashScreen.hideAsync().catch(() => {});
      }
    })();
  }, [queryClient]);

  if (!href) return null;
  return <Redirect href={href} />;
}
