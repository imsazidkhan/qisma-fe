/**
 * Border-radius primitives — both the geometric scale AND semantic aliases.
 *
 * Both are exposed to Tailwind as `rounded-{key}`, so `rounded-md`,
 * `rounded-card`, `rounded-modal`, and `rounded-full` all work.
 */
export const radius = {
  // Scale
  none: 0,
  xs: 4, // checkboxes, small tags, tooltips
  sm: 6, // chips, badges, small buttons
  md: 8, // inputs, default buttons, menus
  lg: 12, // cards, sheets, popovers
  xl: 16, // large cards, action sheets
  '2xl': 24, // modals, drawers
  /** Invite inbox cards — premium floating panels. */
  inviteCard: 28,
  '3xl': 32, // hero cards, feature banners
  full: 9999, // pills, avatars, FABs, toggle tracks

  // Semantic aliases
  tag: 4,
  button: 8,
  buttonSmall: 6,
  input: 8,
  card: 12,
  cardLarge: 16,
  modal: 24,
  avatar: 9999,
  fab: 9999,
  toggle: 9999,
  tooltip: 6,
  notification: 12,
  image: 8,
  imageLarge: 12,
  skeleton: 6,
  skeletonCircle: 9999,
} as const;
