import { StyleSheet } from 'react-native';

import { radius, space, textStyles, typography } from '@/theme';

export const groupExpenseFeedRowStyles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    borderRadius: radius['2xl'],
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.gapMd,
    gap: space.gapSm,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.gapSm,
    alignSelf: 'stretch',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
    flexWrap: 'wrap',
  },
  titleEmoji: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.fontSize.lg + 4,
  },
  titleText: {
    ...textStyles.body,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.tight,
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  amount: {
    ...textStyles.numeric,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.fontSize.lg * typography.lineHeight.tight,
    fontWeight: '600',
    flexShrink: 0,
    textAlign: 'right',
  },
  metaLine: {
    ...textStyles.captionSmall,
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.wide,
  },
  clock: {
    ...textStyles.captionSmall,
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.wide,
    marginTop: space.gapXs,
  },
});
