import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Counts down to an absolute server-provided timestamp (`targetMs`).
 *
 * Why absolute, not "X seconds":
 *   - We MUST derive from the server-given expiry/cooldown, not from
 *     `Date.now()` at request time. That keeps timers honest across:
 *       a) clock skew between client and server,
 *       b) the JS thread being janked for hundreds of ms,
 *       c) the app being backgrounded and re-foregrounded.
 *
 *   - On `AppState` → `active` we recompute from `targetMs - Date.now()`,
 *     so the user never sees the timer "drift" forward after returning.
 *
 * Returns `secondsRemaining` rounded UP (so the visible label hits 0 only
 * once the deadline truly passes). Returns 0 for `null` / past targets.
 */
export function useCountdownToTimestamp(targetMs: number | null): number {
  const [seconds, setSeconds] = useState<number>(() => computeRemaining(targetMs));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSeconds(computeRemaining(targetMs));

    if (targetMs === null) {
      return undefined;
    }

    const tick = () => {
      const next = computeRemaining(targetMs);
      setSeconds(next);
      if (next === 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Sync once immediately, then every second.
    tick();
    intervalRef.current = setInterval(tick, 1_000);

    const onAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        // Re-derive from the absolute deadline; never decrement during
        // background or we'd over-count when the JS loop wakes up.
        tick();
      }
    };
    const sub = AppState.addEventListener('change', onAppStateChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      sub.remove();
    };
  }, [targetMs]);

  return seconds;
}

function computeRemaining(targetMs: number | null): number {
  if (targetMs === null) return 0;
  return Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
}

/** Format `seconds` as `M:SS` for OTP-style countdowns. */
export function formatMmSs(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
