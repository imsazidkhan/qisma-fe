/** Expo Router targets for authenticated routing + onboarding funnel. */
export const SIGNED_IN_PATHS = {
  HOME: '/home',
  ONBOARDING_NAME: '/onboarding/name',
  ONBOARDING_AVATAR: '/onboarding/avatar',
  ONBOARDING_USE_CASE: '/onboarding/use-case',
  LOGIN: '/login',
} as const;

export type SignedInPath = (typeof SIGNED_IN_PATHS)[keyof typeof SIGNED_IN_PATHS];
