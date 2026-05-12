import { useReactQueryDevTools } from '@dev-plugins/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect, useState } from 'react';

import { attachFocusManager } from './focusManager';
import { attachOnlineManager } from './onlineManager';
import { createAppQueryClient } from './queryClient';

/**
 * Owns the singleton `QueryClient` and wires React Native specific bindings
 * (`onlineManager` ↔ NetInfo, `focusManager` ↔ AppState) inside `useEffect`.
 *
 * Mounting the bindings via effect (rather than at module load) keeps fast
 * refresh clean — the listeners get torn down with the component instead of
 * accumulating across reloads.
 *
 * Devtools: `useReactQueryDevTools` no-ops in production builds and when the
 * Expo dev menu isn't available (Expo Go). To actually open them, install and
 * use a custom dev client (`npx expo install expo-dev-client` then
 * `npx expo run:ios` / `:android`) — the React Query inspector then appears
 * under "Open JS Debugger".
 */
export function QueryProvider({ children }: PropsWithChildren) {
  const [client] = useState(createAppQueryClient);

  useEffect(() => {
    const detachOnline = attachOnlineManager();
    const detachFocus = attachFocusManager();
    return () => {
      detachOnline();
      detachFocus();
    };
  }, []);

  useReactQueryDevTools(client);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
