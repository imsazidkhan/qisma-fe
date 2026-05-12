/** English copy for display-name onboarding; also bundled via `locales/en`. */
export const AUTH_DISPLAY_NAME = {
  eyebrow: 'Profile',
  title: 'What should we call you?',
  subtitle: 'Your friends will see this name in groups and expenses.',
  inputLabel: 'Your name',
  charHint: 'Pick something people in your groups will recognise.',
  continue: 'Continue',
  submitting: 'Saving…',
  offlineHint: "You're offline. Connect to save and continue.",

  errors: {
    validationFallback: 'Check your name.',
    displayNameInvalid: "Name can't be empty.",
    session: 'Your session expired. Sign in again.',
    accountInactive: 'Account disabled.',
    userNotFound: 'We could not find your account. Sign in again.',
    retry: 'Connection problem. Try again.',
    unknown: 'Something went wrong. Try again.',
  },

  a11y: {
    inputHint: 'Display name, up to {{max}} characters',
    continueHint: 'Saves your name and continues',
  },
} as const;
