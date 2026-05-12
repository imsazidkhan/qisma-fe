import { StyleSheet } from 'react-native';

import { radius, space, textStyles, typography, zIndex } from '@/theme';

export const loginScreenStyles = StyleSheet.create({
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
    marginBottom: space.sectionGap,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
  },
  brandMark: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },

  header: {
    gap: space.gapMd,
    marginBottom: space.sectionGapLg,
  },
  title: {
    ...textStyles.displaySmall,
  },
  subtitle: {
    ...textStyles.body,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: space.sectionGap,
  },

  form: {
    gap: space.gap,
  },

  otpSection: {
    gap: space.gapMd,
    marginBottom: space.gapMd,
  },
  ttlCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: space.gap,
    paddingHorizontal: space.gap,
    gap: space.gapSm,
    marginBottom: space.gapLg,
  },
  ttlRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  ttlMeta: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },
  ttlCountdown: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['3xl'],
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: space.gapSm,
    marginBottom: space.sectionGap,
    paddingHorizontal: space.gapXs,
  },
  linkHit: {
    paddingVertical: space.gapXs,
    paddingHorizontal: space.gapXs,
  },
  linkHitPressed: {
    opacity: 0.65,
  },
  linkLabel: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },
  linkDivider: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    opacity: 0.6,
  },

  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.gapSm,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: space.gapSm,
    paddingHorizontal: space.gap,
  },
  bannerText: {
    flex: 1,
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.wide,
    paddingTop: 1,
  },

  footer: {
    gap: space.gap,
    paddingTop: space.gap,
    flexShrink: 0,
  },

  /** Pins CTA + footnote to the bottom of the screen (above IME when window resizes). */
  footerDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: zIndex.raised,
  },
  hairline: {
    height: 1,
    width: '100%',
    marginBottom: space.gapXs,
  },
  footnote: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    lineHeight: typography.fontSize['2xs'] * typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.wide,
  },

  progressTrack: {
    height: 2,
    width: '100%',
    overflow: 'hidden',
    borderRadius: radius.full,
  },
  progressFill: {
    height: '100%',
  },
});
