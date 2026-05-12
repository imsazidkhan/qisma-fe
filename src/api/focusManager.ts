import { focusManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Bind TanStack Query's `focusManager` to React Native's `AppState` so that
 * `refetchOnWindowFocus` does something useful — re-fetch active queries when
 * the user foregrounds the app.
 *
 * Returns a teardown function for `useEffect` cleanup.
 */
export function attachFocusManager(): () => void {
  const handleChange = (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
  };
  const subscription = AppState.addEventListener('change', handleChange);
  return () => subscription.remove();
}
