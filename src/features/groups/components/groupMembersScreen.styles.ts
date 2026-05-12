import { StyleSheet } from 'react-native';

import { size, space, textStyles, typography } from '@/theme';

export const groupMembersScreenStyles = StyleSheet.create({
  safe: { flex: 1 },
  listContent: {
    paddingTop: space.gapMd,
    paddingBottom: space.sectionGapLg + 72,
    gap: space.gapXs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginBottom: space.gapMd,
  },
  headerAddHit: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: size.touchMin,
    minHeight: size.touchMin,
  },
  headerAddPlaceholder: {
    minWidth: size.touchMin,
    minHeight: size.touchMin,
  },
  headerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapMd,
    marginBottom: space.sectionGap,
    alignSelf: 'stretch',
  },
  headerAvatarRing: {
    width: 48,
    height: 48,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarImg: {
    width: 48,
    height: 48,
  },
  headerGlyph: {
    fontSize: 22,
    lineHeight: 26,
  },
  headerTitles: {
    flex: 1,
    gap: space.gapXs,
    minWidth: 0,
  },
  title: {
    ...textStyles.h3,
    letterSpacing: typography.letterSpacing.tight,
  },
  subtitle: {
    ...textStyles.caption,
  },
  skeletonRow: {
    height: 64,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: space.gapXs,
  },
  fab: {
    position: 'absolute',
    width: size.touchMin,
    height: size.touchMin,
    borderRadius: size.touchMin / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorBanner: {
    padding: space.gapMd,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: space.gapMd,
    gap: space.gapSm,
    alignSelf: 'stretch',
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
});
