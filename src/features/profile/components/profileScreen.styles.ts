import { StyleSheet } from 'react-native';

import { radius, space, spacing, textStyles, typography } from '@/theme';

/** Matches `rowIconBox` width — hairline + inset rows share this baseline. */
const PROFILE_ROW_ICON_BOX = 40;

export const profileScreenStyles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingTop: space.gapMd,
    alignSelf: 'stretch',
    width: '100%',
  },
  screenHeader: {
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: space.gapLg,
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
  headerBlock: {
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingBottom: space.sectionGap,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 96,
    height: 96,
  },
  avatarInitials: {
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize['2xl'],
    letterSpacing: typography.letterSpacing.tight,
  },
  displayName: {
    ...textStyles.h2,
    letterSpacing: typography.letterSpacing.tight,
    marginTop: space.gapLg,
    textAlign: 'center',
    width: '100%',
  },
  phoneLine: {
    ...textStyles.body,
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.sm,
    letterSpacing: typography.letterSpacing.wide,
    marginTop: space.gapSm,
    textAlign: 'center',
    width: '100%',
  },
  editProfileBtn: {
    marginTop: space.gapLg,
    minWidth: 200,
    paddingHorizontal: space.gapLg,
    alignSelf: 'center',
  },
  sectionGap: {
    marginTop: space.sectionGap,
    alignSelf: 'stretch',
    width: '100%',
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
  /** Profile hero — centered under display name. */
  signOutPressable: {
    alignSelf: 'center',
    marginTop: space.gapSm,
    paddingVertical: space.gapSm,
    paddingHorizontal: space.gapMd,
  },
  signOutLabel: {
    fontFamily: typography.fontFamily.sans.medium,
  },
});
