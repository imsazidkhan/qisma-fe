import { StyleSheet } from 'react-native';

import { radius, space, textStyles, typography } from '@/theme';

export const expenseDetailScreenStyles = StyleSheet.create({
  safe: { flex: 1 },
  body: {
    paddingTop: space.gapMd,
    gap: space.sectionGap,
    paddingBottom: space.sectionGapLg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  heroBlock: {
    alignSelf: 'stretch',
    gap: space.gapSm,
    paddingVertical: space.gapMd,
    paddingHorizontal: space.gapMd,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  section: {
    alignSelf: 'stretch',
    gap: space.gapSm,
  },
  sectionKicker: {
    ...textStyles.overline,
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.widest,
  },
  cardRow: {
    paddingVertical: space.gapSm,
    paddingHorizontal: space.gapMd,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space.gapXs,
    alignSelf: 'stretch',
  },
  monoMeta: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.wide,
  },
});
