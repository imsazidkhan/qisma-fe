import { StyleSheet } from 'react-native';

import { radius, space, textStyles, typography } from '@/theme';

export const groupBalanceScreenStyles = StyleSheet.create({
  safe: { flex: 1 },
  flexFill: { flex: 1 },
  listContent: {
    paddingHorizontal: space.screenPaddingLg,
    paddingBottom: space.gapXl,
    flexGrow: 1,
  },
  headerShell: {
    alignSelf: 'stretch',
    marginBottom: space.gapMd,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  headerTitles: {
    flex: 1,
    minWidth: 0,
    gap: space.paddingXs,
    paddingTop: 0,
    paddingRight: 0,
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
  hubCardWrap: {
    marginTop: space.gapSm,
    alignSelf: 'stretch',
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
  offlineBanner: {
    alignSelf: 'stretch',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.gapSm,
    paddingHorizontal: space.gapMd,
    marginBottom: space.gapSm,
  },
  emptyShell: {
    paddingVertical: space.gapLg,
    gap: space.gapSm,
    alignSelf: 'stretch',
  },
  emptyTitle: {
    ...textStyles.h3,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.sans.semiBold,
    zIndex: 1,
  },
  emptyBody: {
    ...textStyles.body,
    fontSize: typography.fontSize.sm,
    zIndex: 1,
    maxWidth: 280,
  },
});
