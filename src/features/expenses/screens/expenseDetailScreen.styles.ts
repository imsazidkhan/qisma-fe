import { StyleSheet } from 'react-native';

import { layoutGrid, radius, size, textStyles, typography } from '@/theme';

/**
 * Expense detail — Nothing OS–aligned surface language:
 * monochrome from `useThemeColors()`, hairline borders only, generous vertical rhythm,
 * Inter for prose / display numerals, mono for rails and metadata.
 *
 * Layout: `layoutGrid` — gutter & card inset 24 · overview stack gap 16 · major foot 40 (`THEME.md`).
 */
export const expenseDetailScreenStyles = StyleSheet.create({
  safe: { flex: 1 },
  /** Thread tab: fill space above sticky composer. */
  detailScrollFlex: {
    flex: 1,
  },
  /** Thread list + floating day chip overlay wrapper. */
  threadListWrap: {
    flex: 1,
    position: 'relative',
  },
  /** Thread tab: let short threads breathe vertically inside the scroll region. */
  detailScrollContentThread: {
    flexGrow: 1,
  },
  /** Scrollable thread list content — horizontal inset matches `body`. */
  threadListContent: {
    paddingHorizontal: layoutGrid.inset,
    paddingBottom: layoutGrid.sm,
  },
  /** Fill viewport when there are no rows so empty/error states center. */
  threadListContentEmpty: {
    justifyContent: 'center',
  },
  /** Thread composer docking rail — tonal hairline above floating shell. */
  threadComposerStickyOuter: {
    alignSelf: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  /** Loading / error shells — same horizontal rail as `body` (header aligns with cards). */
  asyncShell: {
    flex: 1,
    paddingHorizontal: layoutGrid.inset,
    gap: layoutGrid.section,
  },
  body: {
    paddingTop: layoutGrid.sm,
    gap: layoutGrid.sm,
    paddingBottom: layoutGrid.major,
    paddingHorizontal: layoutGrid.inset,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  headerRoot: {
    alignSelf: 'stretch',
    gap: layoutGrid.inset,
    paddingTop: layoutGrid.inset,
  },
  headerNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  headerNavSpacer: {
    flex: 1,
    minWidth: layoutGrid.micro,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutGrid.sm,
  },
  headerIconButton: {
    minWidth: size.touchMin,
    minHeight: size.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layoutGrid.micro,
  },
  headerIdentityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: layoutGrid.sm,
    alignSelf: 'stretch',
  },
  headerTitleColumn: {
    flex: 1,
    minWidth: 0,
    gap: layoutGrid.micro,
    justifyContent: 'center',
  },
  section: {
    alignSelf: 'stretch',
    gap: layoutGrid.sm,
  },
  sectionKicker: {
    ...textStyles.overline,
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.widest,
  },
  cardRow: {
    paddingVertical: layoutGrid.inset,
    paddingHorizontal: layoutGrid.inset,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: layoutGrid.micro,
    alignSelf: 'stretch',
  },
  monoMeta: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.wide,
  },
  splitSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: layoutGrid.sm,
    alignSelf: 'stretch',
  },
  splitSectionHeaderRowStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: layoutGrid.micro,
  },
  splitSectionMetaStacked: {
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  splitSectionTitle: {
    ...textStyles.labelSmall,
    fontFamily: typography.fontFamily.mono.medium,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
    lineHeight: typography.fontSize['2xs'] * typography.lineHeight.loose,
  },
  splitSectionMeta: {
    ...textStyles.captionSmall,
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
    fontFamily: typography.fontFamily.sans.medium,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.xs * typography.lineHeight.loose,
    letterSpacing: typography.letterSpacing.normal,
  },
  /** Equal-split contextual insight — icon rail + copy stack. */
  splitInsightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: layoutGrid.inset,
    paddingVertical: layoutGrid.sm,
    paddingHorizontal: layoutGrid.inset,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  splitInsightIconSlot: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  splitInsightCopy: {
    flex: 1,
    minWidth: 0,
    gap: layoutGrid.sm,
  },
  splitInsightTitle: {
    fontFamily: typography.fontFamily.sans.medium,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.lg * typography.lineHeight.snug,
    letterSpacing: typography.letterSpacing.tight,
  },
  splitInsightBody: {
    ...textStyles.caption,
    letterSpacing: typography.letterSpacing.normal,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  /** Non–even split overview — mono caption, hairline only (no shadow). */
  overviewSplitContextStrip: {
    alignSelf: 'stretch',
    paddingVertical: layoutGrid.sm,
    paddingHorizontal: layoutGrid.inset,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  overviewSplitContextStripLabel: {
    ...textStyles.captionSmall,
    fontFamily: typography.fontFamily.mono.regular,
    letterSpacing: typography.letterSpacing.wide,
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
  },
  splitParticipantCard: {
    alignSelf: 'stretch',
    borderRadius: radius.inviteCard,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  splitParticipantEmpty: {
    paddingVertical: layoutGrid.inset,
    paddingHorizontal: layoutGrid.inset,
    alignSelf: 'stretch',
  },
  /**
   * Thread tab — premium Threads × WhatsApp × Nothing OS hybrid.
   *
   * Dotted rules for day splits → message stream with avatar-column connectors →
   * sticky composer (message + send; receipts via Files tab).
   *
   * Surfaces stay monochrome via `surfaceFloating` / `surfaceRaised`;
   * hairline borders only — never elevation shadows.
   */
  threadDottedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingVertical: layoutGrid.micro,
  },
  threadDottedLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutGrid.sm,
    alignSelf: 'stretch',
    paddingVertical: layoutGrid.micro,
  },
  threadDottedFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    minWidth: 0,
    height: 8,
  },
  threadDot: {
    width: 2,
    height: 2,
    borderRadius: radius.full,
  },
  threadItemRowOther: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: layoutGrid.sm,
    alignSelf: 'stretch',
  },
  threadItemRowSelf: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
  },
  threadItemAvatarColumn: {
    width: 36,
    alignItems: 'center',
    flexShrink: 0,
  },
  threadItemConnector: {
    width: StyleSheet.hairlineWidth * 2,
    flex: 1,
    opacity: 0.6,
    alignSelf: 'center',
  },
  threadAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  threadAvatarImg: {
    width: 36,
    height: 36,
  },
  threadAvatarInitial: {
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.wide,
  },
  threadItemContentOther: {
    flex: 1,
    minWidth: 0,
    maxWidth: '88%',
    gap: layoutGrid.micro,
    alignItems: 'flex-start',
  },
  threadItemContentSelf: {
    flexShrink: 1,
    maxWidth: '82%',
    gap: layoutGrid.micro,
    alignItems: 'flex-end',
  },
  threadItemHeaderOther: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutGrid.micro,
    flexWrap: 'wrap',
  },
  threadItemHeaderSelf: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: layoutGrid.micro,
  },
  threadItemHeaderSep: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
  },
  threadItemAuthor: {
    fontFamily: typography.fontFamily.sans.semiBold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.normal,
  },
  threadItemTime: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.wide,
  },
  threadBubbleOther: {
    paddingVertical: layoutGrid.sm,
    paddingHorizontal: layoutGrid.inset,
    borderRadius: radius.xl,
    borderTopLeftRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  threadBubbleSelf: {
    paddingVertical: layoutGrid.sm,
    paddingHorizontal: layoutGrid.inset,
    borderRadius: radius.xl,
    borderTopRightRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  /** Text + WhatsApp-like timestamp row inside the bubble. */
  threadBubbleInner: {
    gap: layoutGrid.micro,
    alignSelf: 'stretch',
  },
  /** Bottom-right footer: clock + optional subtle sent indicator. */
  threadBubbleFooter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
    flexWrap: 'nowrap',
    gap: layoutGrid.micro,
    marginLeft: layoutGrid.sm,
  },
  threadBubbleBody: {
    fontFamily: typography.fontFamily.sans.regular,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.normal,
    alignSelf: 'stretch',
  },
  /** Compact mono clock — chats use small type above bubble rail. */
  threadBubbleClock: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.wide,
  },
  threadItemFootSelf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  threadSentDot: {
    width: 3,
    height: 3,
    borderRadius: radius.full,
    opacity: 0.7,
  },
  threadEmptyShell: {
    paddingVertical: layoutGrid.section,
    paddingHorizontal: layoutGrid.inset,
    alignItems: 'center',
    justifyContent: 'center',
    gap: layoutGrid.sm,
  },
});
