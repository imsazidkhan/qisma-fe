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
  /** Compact expense ledger rows — Apple Wallet slab (~26 dp corner). */
  expenseLedgerCard: 26,
  /** Expense feed metadata pills (compact ledger chips). */
  feedMetaPill: 14,
  /** Floating home tab dock — horizontal pill (Wallet / Nothing OS). */
  tabBarDock: 24,
  /** Selected segment inside floating tab rail. */
  tabBarTabPill: 20,
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
  /** Lastbench hub ambient search — Arc / Linear soft capsule (~18 dp). */
  ambientSearch: 18,
  fab: 9999,
  toggle: 9999,
  tooltip: 6,
  notification: 12,
  image: 8,
  imageLarge: 12,
  skeleton: 6,
  skeletonCircle: 9999,
  /** Primary phone field on add-members — Nothing-style ~20dp shell. */
  addMemberPhone: 20,
  /** Groups hub search — compact field radius. */
  groupsSearch: 10,
  /** Group list row — quiet slab, not a bubble. */
  groupsCard: 12,
  /** Group list lead tile — matches quiet card radius. */
  groupsLeadTile: 12,
} as const;
