/**
 * Serializes refresh attempts so parallel 401s don't stampede `/v1/auth/refresh`.
 * Dynamic import avoids a static import cycle: `apiFetch` → this module → `authSession`
 * → `authApi` → `apiFetch`.
 */
let refreshInFlight: Promise<boolean> | null = null;

export function tryRefreshAfterUnauthorized(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async (): Promise<boolean> => {
      try {
        const { refreshStoredSession } = await import('@/features/auth/services/authSession');
        await refreshStoredSession();
        return true;
      } catch {
        const { clearAuthSession } = await import('@/features/auth/services/authSession');
        await clearAuthSession();
        const { runForcedSignOutNavigation } =
          await import('@/features/auth/services/authForcedNavigation');
        runForcedSignOutNavigation();
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}
