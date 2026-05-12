import { StyleSheet } from 'react-native';

import { radius, space } from '@/theme';

export const groupDetailRouteStyles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1, paddingTop: space.gapMd },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'stretch',
    marginBottom: space.gapSm,
  },
  centered: {
    flex: 1,
    paddingTop: space.gapMd,
    paddingHorizontal: space.screenPadding,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    marginTop: space.sectionGap,
    paddingVertical: space.gapSm,
    paddingHorizontal: space.gapLg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
