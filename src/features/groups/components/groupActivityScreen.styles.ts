import { StyleSheet } from 'react-native';

import { radius, space, textStyles, typography } from '@/theme';

export const groupActivityScreenStyles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.gapMd,
  },
  headerBlock: {
    marginBottom: space.gapLg,
    gap: space.gapSm,
  },
  title: {
    ...textStyles.h3,
  },
  subtitle: {
    ...textStyles.caption,
    letterSpacing: typography.letterSpacing.wide,
  },
  listContent: {
    paddingHorizontal: space.screenPadding,
    paddingBottom: space.gapXl,
    flexGrow: 1,
    gap: space.gap,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapMd,
    paddingVertical: space.paddingSm,
    paddingHorizontal: space.paddingMd,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  avatarGlyph: {
    ...textStyles.label,
    fontSize: typography.fontSize.sm,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  kindLabel: {
    ...textStyles.overline,
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.widest,
  },
  rowTitle: {
    ...textStyles.body,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  rowMeta: {
    ...textStyles.captionSmall,
    fontSize: typography.fontSize.xs,
  },
  emptyBlock: {
    paddingVertical: space.gapXl,
    gap: space.gapSm,
  },
  footerHint: {
    ...textStyles.captionSmall,
    marginTop: space.gapLg,
    textAlign: 'center',
  },
  centeredBody: {
    flex: 1,
    paddingHorizontal: space.screenPadding,
    gap: space.gapMd,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    marginTop: space.gapSm,
    paddingVertical: space.gapSm,
    paddingHorizontal: space.gapMd,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorBanner: {
    marginBottom: space.gapMd,
    padding: space.gapMd,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
