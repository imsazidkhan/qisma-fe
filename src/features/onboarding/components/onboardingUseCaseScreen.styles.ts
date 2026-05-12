import { StyleSheet } from 'react-native';

import { radius, space, textStyles, typography } from '@/theme';

export const onboardingUseCaseScreenStyles = StyleSheet.create({
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
    justifyContent: 'space-between',
    marginBottom: space.sectionGapSm,
  },
  topBarSpacer: {
    flex: 1,
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

  // ---- LIST ---------------------------------------------------------------
  // Section label sits above the list, mono-uppercase metadata feel.
  listSectionLabel: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    lineHeight: typography.fontSize['2xs'] * typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
    marginBottom: space.gapSm,
  },
  listGroup: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },

  // ---- ROW ----------------------------------------------------------------
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.padding,
    paddingVertical: space.gapMd,
    minHeight: 72,
  },
  rowIndex: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    lineHeight: typography.fontSize['2xs'] * typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.widest,
    width: 28,
  },
  rowBody: {
    flex: 1,
    paddingRight: space.gap,
    gap: 2,
  },
  rowTitle: {
    fontFamily: typography.fontFamily.sans.semiBold,
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.snug,
    letterSpacing: typography.letterSpacing.normal,
  },
  rowSubtitle: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.normal,
  },
  rowTrailing: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowArrow: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.fontSize.lg,
  },

  // ---- FOOTER (skip) ------------------------------------------------------
  // Sits below the ScrollView, separated by a hairline. The skip CTA is a
  // tertiary text link — calm mono uppercase, never competes with the list.
  footer: {
    paddingTop: space.gapMd,
    gap: space.gapMd,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  skipButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.gapSm,
    paddingHorizontal: space.padding,
  },
  skipLabel: {
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },
});
