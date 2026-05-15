import { StyleSheet } from 'react-native';

import { radius, space, typography } from '@/theme';

export const addMemberContactRowStyles = StyleSheet.create({
  rowShell: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.gapSm,
    marginHorizontal: -space.gapSm,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapMd,
    paddingVertical: space.gapMd,
    alignSelf: 'stretch',
    minHeight: 56,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatarGlyph: {
    fontSize: 16,
    fontFamily: typography.fontFamily.sans.semiBold,
  },
});
