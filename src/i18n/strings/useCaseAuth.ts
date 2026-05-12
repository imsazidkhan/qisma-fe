/** English strings for onboarding use-case; wire into `locales/en` later if needed. */
export const AUTH_USE_CASE = {
  eyebrow: 'Almost there',
  title: 'How will you use this app?',
  subtitle: 'Pick the option that fits best—you can refine this later.',

  listLabel: 'Select one',

  options: {
    personal: 'Personal finances',
    work_or_business: 'Work or business',
    with_groups: 'Managing groups',
    just_exploring: 'Just exploring',
  },

  optionDescriptions: {
    personal: 'Track your own income, spending and goals.',
    work_or_business: 'Manage invoices, expenses and team budgets.',
    with_groups: 'Split costs and settle up with friends or roommates.',
    just_exploring: 'Look around first, set things up later.',
  },

  offlineHint: "You're offline. Connect to finish setup.",
  continueA11y: 'Saves your choice and completes onboarding',

  skip: 'Skip for now',
  skipping: 'Skipping…',
  skipA11y: 'Completes onboarding without choosing a use case',
} as const;
