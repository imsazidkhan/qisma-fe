import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import { type ColorMode, colorsByMode } from './colors';

/**
 * User-facing theme preference.
 *
 * - `system` — follow the OS color scheme (default; what Nothing OS does).
 * - `light` — force the light palette regardless of OS.
 * - `dark`  — force the dark palette regardless of OS.
 */
export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  /** Raw user preference (may be `system`). */
  preference: ThemePreference;
  /** Update the preference — typically wired to a settings toggle. */
  setPreference: (next: ThemePreference) => void;
  /** Resolved scheme actually being rendered. Never `system`. */
  mode: ColorMode;
  /** Active palette for the current `mode`. */
  colors: (typeof colorsByMode)[ColorMode];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = PropsWithChildren<{
  /** Initial preference. Defaults to following the system. */
  defaultPreference?: ThemePreference;
}>;

export function ThemeProvider({ children, defaultPreference = 'system' }: ThemeProviderProps) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(defaultPreference);

  const mode: ColorMode = preference === 'system' ? (system ?? 'dark') : preference;

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      setPreference,
      mode,
      colors: colorsByMode[mode],
    }),
    [preference, setPreference, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme / useThemeColors must be used within <ThemeProvider />');
  }
  return ctx;
}

/** The active palette. Re-evaluates on theme change. */
export function useThemeColors() {
  return useTheme().colors;
}

/** The resolved color mode — `light` or `dark`. Never `system`. */
export function useThemeMode() {
  return useTheme().mode;
}

/** Read & set the user's preference (`system` | `light` | `dark`). */
export function useThemePreference() {
  const { preference, setPreference } = useTheme();
  return [preference, setPreference] as const;
}
