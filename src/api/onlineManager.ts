import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

/**
 * Bind TanStack Query's `onlineManager` to React Native's NetInfo.
 *
 * Why this exists: TanStack Query was built for the browser, where
 * `navigator.onLine` is the source of truth. In RN that doesn't exist, so
 * Query defaults to "always online" — meaning paused queries never resume,
 * and `refetchOnReconnect` is dead. This wires it up properly.
 *
 * `isInternetReachable === false` is treated as "offline" — `null` means
 * "not yet determined", which we charitably treat as "online" so the very
 * first request after launch isn't blocked.
 */
export function attachOnlineManager(): () => void {
  // `onlineManager.setEventListener` itself returns `void` and stores the
  // setup's cleanup internally — capture our own NetInfo unsubscribe so we
  // can tear it down on component unmount.
  let netInfoUnsub: (() => void) | undefined;

  onlineManager.setEventListener((setOnline) => {
    netInfoUnsub = NetInfo.addEventListener((state) => {
      const reachable = state.isInternetReachable !== false;
      setOnline(Boolean(state.isConnected) && reachable);
    });
    return () => netInfoUnsub?.();
  });

  return () => {
    netInfoUnsub?.();
    netInfoUnsub = undefined;
  };
}
