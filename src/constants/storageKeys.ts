/**
 * Centralised string keys used with `@/services/storage`. Keep one source of
 * truth so a typo doesn't silently orphan data — and so we can grep for every
 * place a given key is read/written.
 */
export const STORAGE_KEYS = {
  /** Stable per-install opaque id sent as the `X-Device-Id` header. */
  deviceId: 'qisma.device.id',
  /** Persisted theme preference (`system | light | dark`) — future use. */
  themePreference: 'qisma.theme.preference',
  /**
   * Set after a successful `PATCH /v1/auth/me` **name** save (name step only).
   * Used with `onboardingNameStepUserId`; full completion uses `onboardingFullyComplete`.
   */
  onboardingNameStepComplete: 'qisma.onboarding.nameStep.complete',
  /** JWT `sub` for the user who completed the name step on this device. */
  onboardingNameStepUserId: 'qisma.onboarding.nameStep.userId',
  /**
   * Set after avatar step finishes (upload + PATCH avatarUrl, **or skip**) on device.
   * Pairs with `onboardingAvatarStepUserId`; used for offline routing to use-case.
   */
  onboardingAvatarStepComplete: 'qisma.onboarding.avatarStep.complete',
  onboardingAvatarStepUserId: 'qisma.onboarding.avatarStep.userId',
  /**
   * Set after use-case succeeds (`PATCH /v1/auth/me` with useCase + onboarding completed).
   * Pairs with `onboardingFullyCompleteUserId`.
   */
  onboardingFullyComplete: 'qisma.onboarding.fully.complete',
  onboardingFullyCompleteUserId: 'qisma.onboarding.fully.userId',

  /** @deprecated Prefer `onboardingFullyComplete`; kept for offline migration (treated like fully complete when sub matches). */
  onboardingDisplayNameComplete: 'qisma.onboarding.displayName.complete',
  /** @deprecated Use `onboardingFullyCompleteUserId`; read only for migration. */
  onboardingDisplayNameUserId: 'qisma.onboarding.displayName.userId',

  /**
   * `auth.me.id` for which the post-sign-in "You've been invited…" sheet was dismissed.
   * Cleared on sign-out is optional — mismatch on new user shows the sheet again.
   */
  invitesPostSignInPromptDismissedUserId: 'qisma.invites.postSignIn.dismissedUserId',

  /** Last split method chosen on Add expense (non-sensitive UX preference). */
  expenseLastSplitType: 'qisma.expense.lastSplitType',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
