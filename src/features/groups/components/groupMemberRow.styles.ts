import { StyleSheet } from 'react-native';

import { radius, size, space, textStyles } from '@/theme';

export const groupMemberRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapMd,
    paddingVertical: space.gapMd,
    minHeight: size.touchMin,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 44,
    height: 44,
  },
  initials: {
    ...textStyles.label,
  },
  textCol: {
    flex: 1,
    gap: space.gapXs,
    minWidth: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.gapXs,
  },
  inviteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.gapMd,
    marginTop: space.gapXs,
  },
  trailingCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: space.gapSm,
  },
  inviteAction: {
    paddingVertical: space.gapXs,
    paddingHorizontal: space.gapSm,
  },
  inviteActionLabel: {
    ...textStyles.label,
  },
  rolePressable: {
    paddingVertical: space.gapSm,
    paddingHorizontal: space.gapSm,
  },
  roleLabel: {
    ...textStyles.label,
  },
  name: {
    ...textStyles.bodyMedium,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: space.gapSm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeLabel: {
    ...textStyles.overline,
    fontSize: 10,
  },
  removePressable: {
    paddingVertical: space.gapSm,
    paddingHorizontal: space.gapSm,
  },
  removeLabel: {
    ...textStyles.label,
  },
});
