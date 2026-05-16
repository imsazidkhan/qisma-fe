import { StyleSheet } from 'react-native';

import { radius, space, textStyles, typography } from '@/theme';

export const editProfileScreenStyles = StyleSheet.create({
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
    alignSelf: 'stretch',
    width: '100%',
    paddingRight: space.gapSm,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    marginRight: 40 + space.gapSm,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: space.gapLg,
    alignSelf: 'stretch',
    width: '100%',
    gap: space.gapXl,
  },
  eyebrow: {
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.widest,
    textAlign: 'center',
    alignSelf: 'stretch',
    textTransform: 'uppercase',
  },
  subtitle: {
    ...textStyles.body,
    textAlign: 'center',
    alignSelf: 'stretch',
    marginTop: space.gapXs,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: space.gapSm,
    alignSelf: 'stretch',
  },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 112,
    height: 112,
  },
  avatarInitials: {
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize['3xl'],
    letterSpacing: typography.letterSpacing.tight,
  },
  changeAvatarLabel: {
    fontFamily: typography.fontFamily.sans.medium,
    fontSize: typography.fontSize.sm,
    letterSpacing: typography.letterSpacing.normal,
  },
  footer: {
    paddingTop: space.gapXl,
    alignSelf: 'stretch',
    width: '100%',
  },
  loadingBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.gapMd,
  },
  errorBanner: {
    alignSelf: 'stretch',
    width: '100%',
    gap: space.gapSm,
  },
});
