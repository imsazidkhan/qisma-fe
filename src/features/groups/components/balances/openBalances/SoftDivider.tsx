import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemeColors } from '@/theme';

export type SoftDividerProps = {
  /** Additional inset from the leading edge (e.g. past avatar column). */
  insetLeft?: number;
  insetRight?: number;
  opacity?: number;
};

export function SoftDivider({
  insetLeft = 0,
  insetRight = 0,
  opacity = 0.38,
}: SoftDividerProps): ReactElement {
  const palette = useThemeColors();

  return (
    <View
      style={[
        styles.track,
        {
          marginLeft: insetLeft,
          marginRight: insetRight,
          backgroundColor: palette.borderSubtle,
          opacity,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  track: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
});
