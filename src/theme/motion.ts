/**
 * Animation tokens.
 *
 * - **Programmatic** (gestures, layout transitions): use Reanimated v3+ with
 *   `withTiming`, `withSpring`, plus the `rn` / `config` / `spring` fields here.
 * - **Static / prop-driven** (CSS-style transitions): use the `tw` fields with
 *   NativeWind utilities. These reuse Tailwind defaults — durations and
 *   easings here intentionally round to the standard `duration-*` / `ease-*`
 *   classes. Translate / scale / opacity values match our spacing replace
 *   (e.g. `translate-y-1` resolves to 4px, the same as `translate.xs.value`).
 */
// IMPORTANT: import `Easing` from `react-native-reanimated` (NOT `react-native`).
// Reanimated requires easings used with `withTiming`/`withSpring` to be worklets;
// React Native's `Easing` exports are plain JS functions and will throw
// "The easing function is not a worklet" at runtime. The two APIs are otherwise
// identical (`Easing.bezier(...)`, `Easing.linear`, etc.).
import { Easing } from 'react-native-reanimated';

// ── Duration ──────────────────────────────────────────────────
// `ms` → Reanimated `withTiming({ duration: ms })`
// `tw` → NativeWind `transition-duration` class
export const duration = {
  instant: { ms: 0, tw: 'duration-0' },
  micro: { ms: 80, tw: 'duration-75' },
  fast: { ms: 120, tw: 'duration-100' },
  normal: { ms: 200, tw: 'duration-200' },
  moderate: { ms: 280, tw: 'duration-300' },
  slow: { ms: 350, tw: 'duration-300' },
  slower: { ms: 500, tw: 'duration-500' },
  crawl: { ms: 700, tw: 'duration-700' },
  dramatic: { ms: 1000, tw: 'duration-1000' },
} as const;

// ── Easing ────────────────────────────────────────────────────
// Pick by intent:
//   enter      → decelerate (fast start, slow finish — arrives gently)
//   exit       → accelerate (slow start, fast finish — leaves quickly)
//   standard   → general UI transitions
//   emphasized → on-brand "extra" curve (alias of standard for now)
//   bounce     → physical interactions (drag release, swipe)
export const easing = {
  standard: {
    bezier: [0.2, 0.0, 0.0, 1.0] as const,
    tw: 'ease-out',
    rn: Easing.bezier(0.2, 0.0, 0.0, 1.0),
  },
  enter: {
    bezier: [0.0, 0.0, 0.2, 1.0] as const,
    tw: 'ease-out',
    rn: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  },
  exit: {
    bezier: [0.4, 0.0, 1.0, 1.0] as const,
    tw: 'ease-in',
    rn: Easing.bezier(0.4, 0.0, 1.0, 1.0),
  },
  emphasized: {
    bezier: [0.2, 0.0, 0.0, 1.0] as const,
    tw: 'ease-out',
    rn: Easing.bezier(0.2, 0.0, 0.0, 1.0),
  },
  linear: {
    bezier: [0.0, 0.0, 1.0, 1.0] as const,
    tw: 'ease-linear',
    rn: Easing.linear,
  },
  bounce: {
    bezier: [0.34, 1.56, 0.64, 1.0] as const,
    // CSS has no bounce; nearest is ease-out. Use `rn` (Reanimated) for the
    // real overshoot curve.
    tw: 'ease-out',
    rn: Easing.bezier(0.34, 1.56, 0.64, 1.0),
  },
} as const;

// ── Spring ────────────────────────────────────────────────────
// For Reanimated `withSpring(value, config)` and Moti.
// NativeWind has no spring primitive — use `duration` + `easing.bounce`
// for CSS-style approximations.
export const spring = {
  /** Quick response, minimal bounce. Default for most interactions. */
  snappy: { damping: 18, stiffness: 250, mass: 1, overshootClamping: false },
  /** Playful, slight overshoot. FAB, success states. */
  bouncy: { damping: 10, stiffness: 180, mass: 1, overshootClamping: false },
  /** Slow, smooth settle. Large layout shifts. */
  gentle: { damping: 26, stiffness: 170, mass: 1, overshootClamping: false },
  /** Instant feel, no bounce. Press feedback. */
  stiff: { damping: 40, stiffness: 400, mass: 1, overshootClamping: true },
  /** High overshoot. Onboarding, celebration moments only. */
  wobbly: { damping: 6, stiffness: 120, mass: 1, overshootClamping: false },
} as const;

// ── Scale ─────────────────────────────────────────────────────
// Press / hover feedback via transform.
export const scale = {
  identity: { value: 1.0, tw: 'scale-100' },
  pressedLight: { value: 0.98, tw: 'active:scale-[0.98]' },
  pressed: { value: 0.96, tw: 'active:scale-95' },
  pressedHard: { value: 0.93, tw: 'active:scale-90' },
  expanded: { value: 1.02, tw: 'scale-[1.02]' },
  pop: { value: 1.05, tw: 'scale-105' },
} as const;

// ── Translate ─────────────────────────────────────────────────
// Common offset distances for enter/exit slide animations.
// `value` is in design-system pixels (matches our `spacing` scale exactly:
// `translate-y-1` → 4, `translate-y-16` → 64, etc.).
export const translate = {
  none: { value: 0, tw: 'translate-y-0' },
  xs: { value: 4, tw: 'translate-y-1' },
  sm: { value: 8, tw: 'translate-y-2' },
  md: { value: 16, tw: 'translate-y-4' },
  lg: { value: 32, tw: 'translate-y-8' },
  xl: { value: 64, tw: 'translate-y-16' },
  /** Full container offset — bottom sheet / drawer reveal. */
  screen: { value: '100%' as const, tw: 'translate-y-full' },
} as const;

// ── Opacity ───────────────────────────────────────────────────
// For fade in/out transitions.
export const motionOpacity = {
  hidden: { value: 0, tw: 'opacity-0' },
  faint: { value: 0.08, tw: 'opacity-[0.08]' },
  subtle: { value: 0.2, tw: 'opacity-20' },
  low: { value: 0.38, tw: 'opacity-[0.38]' },
  medium: { value: 0.6, tw: 'opacity-60' },
  high: { value: 0.87, tw: 'opacity-[0.87]' },
  visible: { value: 1, tw: 'opacity-100' },
} as const;

// ── Semantic transition presets ───────────────────────────────
// Each preset has:
//   - `tw` strings (NativeWind) — these encode the animation *intent*
//     (e.g. "fade from 0 → 100 over 200ms"). The duplicate utility classes
//     are NOT meant to be applied as a single `className`; pick the
//     `from` class for the initial render, then swap to the `to` class
//     to trigger the transition (use state, `Animated.View`, or Moti).
//   - `config` — Reanimated `withTiming` options.
//   - `spring` — Reanimated `withSpring` options (where physics is preferred).
export const transition = {
  // Fade
  fadeIn: {
    enter: { tw: 'opacity-0 opacity-100 duration-200 ease-out' },
    config: { duration: duration.normal.ms, easing: easing.enter.rn },
  },
  fadeOut: {
    exit: { tw: 'opacity-100 opacity-0 duration-150 ease-in' },
    config: { duration: duration.fast.ms, easing: easing.exit.rn },
  },

  // Slide up (bottom sheet, toast, modal)
  slideUp: {
    enter: { tw: 'translate-y-full translate-y-0 duration-300 ease-out' },
    config: { duration: duration.moderate.ms, easing: easing.enter.rn },
  },
  slideDown: {
    exit: { tw: 'translate-y-0 translate-y-full duration-200 ease-in' },
    config: { duration: duration.normal.ms, easing: easing.exit.rn },
  },

  // Slide in from right (page push)
  slideInRight: {
    enter: { tw: 'translate-x-full translate-x-0 duration-300 ease-out' },
    config: { duration: duration.moderate.ms, easing: easing.enter.rn },
  },
  slideOutLeft: {
    exit: { tw: 'translate-x-0 -translate-x-full duration-200 ease-in' },
    config: { duration: duration.normal.ms, easing: easing.exit.rn },
  },

  // Scale pop (FAB, success badge, notification badge)
  pop: {
    enter: { tw: 'scale-0 scale-100 duration-200 ease-out' },
    spring: spring.bouncy,
  },

  // Press feedback
  press: {
    down: { tw: 'active:scale-95 duration-75 ease-out' },
    spring: spring.stiff,
  },

  // Skeleton shimmer — relies on Tailwind's built-in `animate-pulse` keyframe.
  // NativeWind v4 maps this through Reanimated automatically.
  shimmer: {
    tw: 'animate-pulse duration-1000',
  },
} as const;

export type Duration = typeof duration;
export type EasingTokens = typeof easing;
export type Spring = typeof spring;
export type Scale = typeof scale;
export type Translate = typeof translate;
export type MotionOpacity = typeof motionOpacity;
export type Transition = typeof transition;

/** @deprecated Use `EasingTokens`. Kept only to avoid breaking earlier imports. */
export type Easing_ = EasingTokens;
