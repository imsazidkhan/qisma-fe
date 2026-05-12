import { StyleSheet } from 'react-native';

import { radius, space, textStyles, typography } from '@/theme';

export const onboardingAvatarScreenStyles = StyleSheet.create({
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
    minHeight: 0,
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
  previewWrap: {
    alignSelf: 'center',
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderLabel: {
    ...textStyles.caption,
    textAlign: 'center',
    paddingHorizontal: space.gapSm,
  },
  footer: {
    marginTop: 'auto',
    gap: space.gap,
    paddingTop: space.gap,
  },
  hairline: {
    height: 1,
    width: '100%',
    opacity: 0.85,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.gapMd,
  },
  dangerSkipAction: {
    alignSelf: 'center',
    paddingVertical: space.gapXs,
    paddingHorizontal: space.gapSm,
  },
  dangerSkipActionPressed: {
    opacity: 0.72,
  },
  dangerSkipText: {
    ...textStyles.caption,
    textAlign: 'center',
    letterSpacing: typography.letterSpacing.wide,
  },
});
