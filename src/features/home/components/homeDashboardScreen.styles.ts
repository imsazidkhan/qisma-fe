import { StyleSheet } from 'react-native';

import { radius, space, textStyles, typography } from '@/theme';

export const homeDashboardScreenStyles = StyleSheet.create({
  scrollContent: {
    paddingTop: space.gapMd,
    paddingBottom: space.sectionGapLg,
    gap: space.sectionGap,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: space.gapSm,
    minHeight: 44,
    justifyContent: 'space-between',
    gap: space.gapMd,
  },
  topBarMeta: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingRight: space.gapSm,
  },
  topBarMetaText: {
    ...textStyles.caption,
    fontFamily: typography.fontFamily.mono.regular,
    letterSpacing: typography.letterSpacing.widest,
    fontVariant: ['tabular-nums'],
  },
  inboxHit: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  inboxIconWrap: {
    position: 'relative',
  },
  inboxBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    ...textStyles.h3,
    letterSpacing: typography.letterSpacing.tight,
  },
  balanceCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.sectionGap,
    paddingHorizontal: space.paddingLg,
    gap: space.gapMd,
    alignItems: 'center',
  },
  balanceEyebrow: {
    ...textStyles.overline,
  },
  balanceNet: {
    ...textStyles.displaySmall,
    fontFamily: typography.fontFamily.mono.medium,
    fontVariant: ['tabular-nums'],
  },
  balanceMetaRow: {
    width: '100%',
    gap: space.gapSm,
    alignItems: 'center',
  },
  balanceMetaLine: {
    ...textStyles.body,
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.sm,
  },
  sectionEyebrow: {
    ...textStyles.overline,
    marginBottom: space.gapSm,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: space.gapMd,
  },
  quickActionBtn: {
    flex: 1,
    minWidth: 0,
  },
  groupList: {
    gap: space.gapSm,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapMd,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.gapMd,
    paddingHorizontal: space.gapMd,
  },
  groupEmoji: {
    fontSize: 28,
    lineHeight: 32,
  },
  groupLeadMedia: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  groupAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
  },
  groupBody: {
    flex: 1,
    minWidth: 0,
    gap: space.gapXs,
  },
  groupName: {
    ...textStyles.label,
  },
  groupBalance: {
    ...textStyles.caption,
    fontFamily: typography.fontFamily.mono.regular,
    letterSpacing: typography.letterSpacing.wide,
  },
  emptyGroupsHint: {
    ...textStyles.body,
    marginTop: space.gapXs,
  },
  seeAll: {
    ...textStyles.labelSmall,
    fontFamily: typography.fontFamily.mono.regular,
    letterSpacing: typography.letterSpacing.widest,
    marginTop: space.gapMd,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
  },
  errorBanner: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.gapMd,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.gap,
  },
});
