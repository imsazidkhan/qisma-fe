import { StyleSheet } from 'react-native';

import { radius, size, space, textStyles, typography } from '@/theme';

export const createGroupScreenStyles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingTop: space.gapLg,
    gap: space.sectionGapLg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hero: {
    gap: space.gapSm,
    maxWidth: 340,
  },
  subtitle: {
    ...textStyles.body,
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
  },
  fieldStack: {
    gap: space.gapMd,
  },
  sectionEyebrow: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },
  iconTap: {
    minWidth: size.touchMin,
    minHeight: size.touchMin,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: space.gapXs,
  },
  iconGlyph: {
    fontSize: 36,
    lineHeight: 42,
  },
  typeList: {
    marginTop: space.gapXs,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: size.touchMin,
    gap: space.gapMd,
  },
  typeRowBar: {
    width: 2,
    borderRadius: 1,
  },
  typeRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
    paddingVertical: space.gapSm,
  },
  typeRowEmoji: {
    width: 28,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.tight,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: space.sectionGapLg,
    alignItems: 'center',
  },
  footerCtaHost: {
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: space.paddingMd,
    paddingVertical: space.paddingSm,
    borderRadius: radius.md,
    overflow: 'hidden',
    maxWidth: '100%',
  },
  cta: {
    minHeight: size.inputLg,
    paddingHorizontal: space.gapLg,
  },
});
