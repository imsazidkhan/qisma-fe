import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Screen-level network reachability.
 *
 * Returns `{ isOnline, isReady }`:
 *   - `isOnline`: true when both `isConnected` and `isInternetReachable`
 *     suggest the device can reach the internet. We treat
 *     `isInternetReachable === null` (NetInfo's "I haven't checked yet")
 *     as online, otherwise the first paint flashes "you're offline".
 *   - `isReady`: false only on the very first frame before the initial
 *     `NetInfo.fetch()` resolves. UI can use this to suppress flash-of-banner.
 *
 * Distinct from the global `onlineManager` binding in `@/api/onlineManager`:
 * that one feeds React Query's pause/resume; this one drives per-screen UI
 * (disabling submit buttons, showing inline banners).
 */
export function useNetworkStatus(): { isOnline: boolean; isReady: boolean } {
  const [state, setState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    let cancelled = false;
    NetInfo.fetch().then((initial) => {
      if (!cancelled) setState(initial);
    });
    const unsubscribe = NetInfo.addEventListener((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!state) return { isOnline: true, isReady: false };

  const reachable = state.isInternetReachable;
  const isOnline = Boolean(state.isConnected) && reachable !== false;
  return { isOnline, isReady: true };
}
