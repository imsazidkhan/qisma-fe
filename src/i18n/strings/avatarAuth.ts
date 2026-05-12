/** English copy for avatar onboarding; bundled via `locales/en`. */
export const AUTH_AVATAR = {
  eyebrow: 'Profile',
  title: 'Add a profile photo',
  subtitle: 'Optional — you can skip and add one later in settings.',
  choosePhoto: 'Choose photo',
  changePhoto: 'Change photo',
  continue: 'Continue',
  uploading: 'Uploading…',
  saving: 'Saving…',
  skip: 'Skip for now',
  offlineHint: "You're offline. Connect to upload.",
  previewA11y: 'Profile photo preview',

  errors: {
    permission: 'Photo library access is needed to pick an image.',
    validationFallback: 'Check your photo and try again.',
    fileType: 'Use a JPEG, PNG, GIF, or WebP image.',
    fileRequired: 'Choose an image to continue.',
    session: 'Your session expired. Sign in again.',
    retry: 'Connection problem. Try again.',
    unknown: 'Something went wrong. Try again.',
  },

  a11y: {
    chooseHint: 'Opens your photo library',
    continueHint: 'Uploads your photo and continues',
    skipHint: 'Continues without a profile photo',
  },
} as const;
