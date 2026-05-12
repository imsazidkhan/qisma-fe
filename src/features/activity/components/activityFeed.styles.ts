import { StyleSheet } from 'react-native';

import { radius, space, textStyles, typography } from '@/theme';

export const activityFeedStyles = StyleSheet.create({
  listContent: {
    gap: space.gap,
    paddingTop: space.gapMd,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapMd,
    paddingVertical: space.paddingSm,
    paddingHorizontal: space.paddingMd,
    borderRadius: radius.xl,
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
    fontSize: 18,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  kindLabel: {
    ...textStyles.overline,
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.widest,
  },
  title: {
    ...textStyles.body,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  meta: {
    ...textStyles.captionSmall,
    fontSize: typography.fontSize.xs,
  },
  skeletonBlock: {
    alignSelf: 'stretch',
    height: 72,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
