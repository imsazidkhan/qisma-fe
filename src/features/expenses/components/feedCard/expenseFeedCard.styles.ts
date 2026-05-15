import { StyleSheet } from 'react-native';

import { CATEGORY_ICON_BUBBLE_SIZE } from '@/features/expenses/components/feedCard/CategoryIconBubble';
import { EXPENSE_FEED_AVATAR_SIZE } from '@/features/expenses/components/feedCard/MemberAvatarStack';
import { radius, spacing } from '@/theme';

const CARD_PAD_X = spacing['4'] + spacing['0.5'];
/** Compact slab — ~36 dp shorter visual footprint vs legacy 16 dp rails. */
const CARD_PAD_Y = spacing['3'] + spacing['0.5'];
/** Icon dock → title column — optical ledger gutter (14 dp). */
const ICON_TITLE_GAP = spacing['3'] + spacing['0.5'];
/** Between stacked ledger bands — kept ≤ 10 dp. */
const ROW_GAP_SM = spacing['1.5'];
const ROW_GAP_MD = spacing['2'];
/** Title/subtitle → meta (`Paid by you`) — slightly roomier than title-row gap. */
const ROW_GAP_META_TOP = spacing['2.5'];
/** Meta band → footer band — breathing room above timestamp row. */
const ROW_GAP_META_TO_FOOTER = spacing['3'];

/** Ledger gutter: icon dock + gap — meta/footer align under title column. */
export const expenseFeedBottomGutter = CATEGORY_ICON_BUBBLE_SIZE + ICON_TITLE_GAP;

export const expenseFeedCardStyles = StyleSheet.create({
  pressOuter: {
    alignSelf: 'stretch',
    marginBottom: spacing['3'],
    borderRadius: radius.expenseLedgerCard,
  },

  /** Inner layout inside {@link FrostedExpenseSurface}. */
  cardBody: {
    paddingHorizontal: CARD_PAD_X,
    paddingTop: CARD_PAD_Y,
    paddingBottom: CARD_PAD_Y,
    zIndex: 1,
  },

  /** Icon + title cluster (amount shares first baseline row). */
  topCluster: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ICON_TITLE_GAP,
    alignSelf: 'stretch',
  },

  titleColumn: {
    flex: 1,
    minWidth: 0,
  },

  titleAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ROW_GAP_MD,
    alignSelf: 'stretch',
  },

  /** Boxes chevron with tabular amount for stable vertical centering. */
  amountChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: spacing['1'],
    minHeight: spacing['6'],
  },

  titleText: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing['1.5'],
  },

  subtitleLine: {
    marginTop: ROW_GAP_SM,
    alignSelf: 'stretch',
  },

  metaRowOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: ROW_GAP_META_TOP,
  },

  metaPillOuter: {
    flex: 1,
    minWidth: 0,
  },

  metaPaidByPillInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing['1'],
    rowGap: spacing['1'],
    width: '100%',
  },

  metaInlineImpactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['1'],
    minWidth: 0,
    flexShrink: 1,
  },

  metaImpactLabel: {
    flex: 1,
    minWidth: 0,
  },

  metaYouPaidCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: spacing['1'],
  },

  metaSplitRest: {
    flex: 1,
    minWidth: 0,
  },

  /** Group glyph + split phrase (`Split equally`). */
  metaSplitCluster: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: spacing['1'],
  },

  bottomMetaOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    width: '100%',
    marginTop: ROW_GAP_META_TO_FOOTER,
    minHeight: EXPENSE_FEED_AVATAR_SIZE,
  },

  bottomGutter: {
    width: expenseFeedBottomGutter,
    flexShrink: 0,
  },

  /** Timestamp ↔ avatar stack — full remaining width, ends spaced (`justify-between`). */
  bottomMetaInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    width: '100%',
    minWidth: 0,
    paddingEnd: spacing['4'],
  },

  bottomTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    gap: spacing['1'],
    minWidth: 0,
    minHeight: EXPENSE_FEED_AVATAR_SIZE,
  },

  timestampText: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },

  /** Vertically centered with timestamp row; trailing edge set by parent `justify-between`. */
  avatarStackWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    flexShrink: 0,
  },
});
