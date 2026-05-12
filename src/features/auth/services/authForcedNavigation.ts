/**
 * Lets app shell register where to send the user when refresh fails and the
 * session is cleared (`authRetry`). Avoids importing `expo-router` from `api/`.
 */
let forcedSignOutHandler: (() => void) | null = null;

export function registerForcedSignOutNavigation(handler: () => void): () => void {
  forcedSignOutHandler = handler;
  return () => {
    forcedSignOutHandler = null;
  };
}

export function runForcedSignOutNavigation(): void {
  forcedSignOutHandler?.();
}
