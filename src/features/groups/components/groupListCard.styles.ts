import { StyleSheet } from 'react-native';

import { radius, space, spacing, typography } from '@/theme';

const LEAD_SIZE = 48;
/** Body line under hero on cards — caption tier. */
const CAPTION = 13;

export const groupListCardStyles = StyleSheet.create({
  card: {
    paddingVertical: spacing['4'],
    paddingLeft: spacing['3'],
    paddingRight: spacing['4'],
    borderRadius: radius.groupsCard,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.gapSm,
  },
  identityCluster: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0,
    gap: space.gapSm,
  },
  lead: {
    width: LEAD_SIZE,
    height: LEAD_SIZE,
    borderRadius: radius.groupsLeadTile,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  leadImage: {
    width: LEAD_SIZE,
    height: LEAD_SIZE,
    borderRadius: radius.groupsLeadTile,
  },
  identityTextColumn: {
    flex: 1,
    minWidth: 0,
    gap: spacing['2'],
  },
  recentExpenseLine: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize['2xs'] * typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wide,
  },
  groupName: {
    fontFamily: typography.fontFamily.sans.semiBold,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.tight,
    lineHeight: typography.fontSize.xl * typography.lineHeight.tight,
  },
  metaLine: {
    fontFamily: typography.fontFamily.sans.regular,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  statusPill: {
    maxWidth: '44%',
    borderRadius: radius.full,
    paddingHorizontal: spacing['2.5'],
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['1'],
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['1'],
  },
  statusPillLabel: {
    fontFamily: typography.fontFamily.sans.medium,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.xs * typography.lineHeight.snug,
  },
  statusPillAmount: {
    fontFamily: typography.fontFamily.sans.semiBold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontVariant: ['tabular-nums'] as const,
    lineHeight: typography.fontSize.sm * typography.lineHeight.snug,
    textAlign: 'center',
  },
  middleBlock: {
    marginTop: spacing['4'],
  },
  middlePrimary: {
    fontFamily: typography.fontFamily.sans.medium,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.md * typography.lineHeight.snug,
  },
  middleSecondary: {
    fontFamily: typography.fontFamily.sans.regular,
    fontSize: CAPTION,
    fontWeight: typography.fontWeight.regular,
    lineHeight: CAPTION * typography.lineHeight.normal,
  },
  footerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing['4'],
    gap: spacing['1.5'],
  },
  footerMetaText: {
    flexShrink: 1,
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize['2xs'] * typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.ledgerCaption,
  },
  footerMetaSep: {
    width: StyleSheet.hairlineWidth,
    height: spacing['3'],
    marginHorizontal: spacing['1'],
  },
});
