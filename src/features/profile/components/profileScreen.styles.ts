import { StyleSheet } from 'react-native';

import { radius, space, spacing, textStyles, typography } from '@/theme';

/** Matches `rowIconBox` width — hairline + inset rows share this baseline. */
const PROFILE_ROW_ICON_BOX = 40;

export const profileScreenStyles = StyleSheet.create({
  /** Natural height — avoid flexGrow so stacked sections appear without a dead zone. */
  scrollContent: {
    paddingTop: space.gapSm,
    alignSelf: 'stretch',
    width: '100%',
  },
  /** Title + one visible edit glyph — no extra chrome. */
  screenHeaderRow: {
    alignSelf: 'stretch',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.gapMd,
    marginBottom: space.gapLg,
  },
  screenHeaderTitles: {
    flex: 1,
    minWidth: 0,
    gap: space.gapXs,
  },
  screenTitle: {
    ...textStyles.h3,
    letterSpacing: typography.letterSpacing.tight,
    width: '100%',
  },
  screenSubtitle: {
    ...textStyles.caption,
    width: '100%',
  },
  heroInnerGap: {
    gap: space.gapMd,
    alignSelf: 'stretch',
    width: '100%',
    paddingVertical: space.paddingSm,
  },
  heroIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapMd,
    alignSelf: 'stretch',
    width: '100%',
  },
  heroTextColumn: {
    flex: 1,
    minWidth: 0,
    gap: space.gapXs,
    justifyContent: 'center',
  },
  heroAvatarRing: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  heroAvatarImage: {
    width: 76,
    height: 76,
  },
  heroAvatarInitials: {
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.xl,
    letterSpacing: typography.letterSpacing.tight,
  },
  heroDisplayName: {
    ...textStyles.h3,
    letterSpacing: typography.letterSpacing.tight,
    textAlign: 'left',
    width: '100%',
  },
  heroPhoneLine: {
    ...textStyles.body,
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.sm,
    letterSpacing: typography.letterSpacing.wide,
    textAlign: 'left',
    width: '100%',
  },
  sectionGap: {
    marginTop: space.gapLg,
    alignSelf: 'stretch',
    width: '100%',
  },
  signOutBlock: {
    marginTop: space.gapXl,
    alignSelf: 'stretch',
    width: '100%',
  },
  footerMeta: {
    alignSelf: 'stretch',
    width: '100%',
    alignItems: 'center',
    marginTop: space.gapMd,
    paddingBottom: space.gapSm,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.sans.semiBold,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.loose,
    letterSpacing: typography.letterSpacing.wide,
    marginBottom: space.gapSm,
    marginLeft: space.gapXs,
  },
  groupCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: space.gapMd,
    paddingVertical: space.gapSm,
  },
  /** Explicit row shell — some targets treat `Pressable` as column; inner `View` is always a row. */
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    width: '100%',
    minHeight: 52,
    paddingVertical: space.gapMd,
  },
  rowPress: {
    alignSelf: 'stretch',
    width: '100%',
  },
  rowLeading: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: space.gapMd,
  },
  rowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: space.gapSm,
  },
  rowIconBox: {
    width: PROFILE_ROW_ICON_BOX,
    height: PROFILE_ROW_ICON_BOX,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.gapMd,
    flexShrink: 0,
  },
  /** Takes remaining width between icon and chevron — `Text` lives inside, no flex on `Text`. */
  rowLabelWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  rowLabel: {
    fontFamily: typography.fontFamily.sans.semiBold,
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.snug,
    letterSpacing: typography.letterSpacing.normal,
  },
  /** Fixed width so trailing values share one vertical edge before the chevron. */
  rowValueWrap: {
    width: spacing['24'],
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rowValueInline: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.snug,
    letterSpacing: typography.letterSpacing.wide,
    textAlign: 'right',
    width: '100%',
  },
  rowChevronWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  /** Inset matches label column (icon + gap). Card already adds horizontal padding. */
  appearanceBlock: {
    paddingLeft: PROFILE_ROW_ICON_BOX + space.gapMd,
    paddingRight: 0,
    paddingTop: space.gapMd,
    paddingBottom: space.gap,
    gap: space.gapSm,
  },
  appearanceEyebrow: {
    fontFamily: typography.fontFamily.sans.medium,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.loose,
    letterSpacing: typography.letterSpacing.wide,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    marginLeft: PROFILE_ROW_ICON_BOX + space.gapMd,
  },
  footerVersion: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
