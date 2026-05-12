import { StyleSheet } from 'react-native';

import { radius, space, textStyles, typography } from '@/theme';

export const groupBalanceScreenStyles = StyleSheet.create({
  safe: { flex: 1 },
  listContent: {
    paddingHorizontal: space.screenPadding,
    paddingBottom: space.gapXl,
    flexGrow: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: space.gapMd,
  },
  headerBlock: {
    alignSelf: 'stretch',
    gap: space.gapXs,
    marginBottom: space.sectionGap,
  },
  title: {
    ...textStyles.h3,
    alignSelf: 'flex-start',
  },
  subtitle: {
    ...textStyles.body,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.mono.regular,
    letterSpacing: typography.letterSpacing.wide,
    alignSelf: 'flex-start',
  },
  sectionKicker: {
    ...textStyles.overline,
    fontSize: typography.fontSize.screenSection,
    fontFamily: typography.fontFamily.mono.medium,
    letterSpacing: typography.letterSpacing.widest,
    alignSelf: 'stretch',
    marginTop: space.gapLg,
    marginBottom: space.gapSm,
  },
  rowPressable: {
    alignSelf: 'stretch',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.gapMd,
    paddingVertical: space.gapMd,
    paddingHorizontal: space.gapSm,
    minHeight: 52,
  },
  rowName: {
    ...textStyles.body,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.sans.medium,
    flex: 1,
    minWidth: 0,
  },
  rowAmount: {
    ...textStyles.numeric,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.mono.medium,
    letterSpacing: typography.letterSpacing.tight,
    flexShrink: 0,
    fontVariant: ['tabular-nums'],
  },
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    opacity: 0.55,
    marginVertical: space.gapXs,
  },
  emptyHint: {
    ...textStyles.body,
    fontSize: typography.fontSize.sm,
    alignSelf: 'flex-start',
    marginTop: space.gapXs,
    marginBottom: space.gapMd,
  },
  errorBanner: {
    alignSelf: 'stretch',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.gapMd,
    gap: space.gapMd,
    marginBottom: space.gapMd,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: space.gapSm,
    paddingHorizontal: space.gapLg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  centeredBody: {
    flex: 1,
    paddingHorizontal: space.screenPadding,
  },
  loader: {
    alignSelf: 'flex-start',
    marginTop: space.gapMd,
  },
});
