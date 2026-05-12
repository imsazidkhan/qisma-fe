import { StyleSheet } from 'react-native';

import { radius, space, textStyles, typography } from '@/theme';

export const onboardingNameScreenStyles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: space.screenPadding,
    paddingTop: space.gapMd,
    paddingBottom: space.sectionGap,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: space.sectionGapSm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: space.sectionGapSm,
    gap: space.gapLg,
  },
  hero: {
    gap: space.gapMd,
  },
  eyebrow: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    lineHeight: typography.fontSize['2xs'] * typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },
  title: {
    ...textStyles.displaySmall,
    letterSpacing: typography.letterSpacing.tight,
    maxWidth: 340,
  },
  subtitle: {
    ...textStyles.body,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    maxWidth: 340,
  },
  offlineLine: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.wide,
    marginTop: space.gapSm,
  },
  formCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: space.gapMd,
    paddingVertical: space.gapLg,
    gap: space.gap,
  },
  form: {
    gap: space.gap,
  },
  counter: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wide,
    fontVariant: ['tabular-nums'],
    minWidth: 44,
    textAlign: 'right',
  },
  footer: {
    gap: space.gap,
    paddingTop: space.gap,
  },
  hairline: {
    height: 1,
    width: '100%',
    opacity: 0.85,
  },
});
