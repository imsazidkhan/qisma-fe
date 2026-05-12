import { StyleSheet } from 'react-native';

import { radius, space, textStyles, typography } from '@/theme';

/** Sync `lead` frame — used to align ledger column with name text. */
const LEAD_SIZE = 36;

export const groupListCardStyles = StyleSheet.create({
  /** Ledger row — identity → finance + activity cluster; calm mono status. */
  card: {
    marginHorizontal: space.gapSm,
    paddingVertical: space.gapMd,
    paddingHorizontal: space.gapMd,
    borderRadius: radius.xs,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space.gapSm,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.gapSm,
  },
  /** Optical nudge — aligns glyph block closer to title cap-height. */
  lead: {
    width: LEAD_SIZE,
    height: LEAD_SIZE,
    borderRadius: radius.xs,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: space.gapXs,
  },
  leadImage: {
    width: LEAD_SIZE,
    height: LEAD_SIZE,
    borderRadius: radius.xs,
  },
  glyph: {
    fontSize: 18,
    lineHeight: 22,
  },
  identityTextColumn: {
    flex: 1,
    minWidth: 0,
    gap: space.gapSm,
  },
  groupName: {
    fontFamily: typography.fontFamily.sans.medium,
    fontSize: typography.fontSize.md,
    letterSpacing: typography.letterSpacing.tight,
  },
  metaCaps: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase' as const,
  },
  ledgerCluster: {
    gap: space.gapSm,
    marginLeft: LEAD_SIZE + space.gapSm,
  },
  financeStatus: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.lg,
    letterSpacing: typography.letterSpacing.normal,
    fontVariant: ['tabular-nums'],
    lineHeight: typography.fontSize.lg * typography.lineHeight.snug,
  },
  activityLine: {
    ...textStyles.captionSmall,
    fontFamily: typography.fontFamily.sans.regular,
    letterSpacing: typography.letterSpacing.normal,
    textTransform: 'none' as const,
  },
});
