import type { ReactElement } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { BalanceDotMatrixTexture } from '@/features/groups/components/BalanceDotMatrixTexture';
import { platformShadow, radius, useThemeColors } from '@/theme';

export type FrostedBalanceSurfaceProps = ViewProps & {
  children: React.ReactNode;
  /** When true, paints the sparse dot grid behind children (hero-only recommended). */
  dotTexture?: boolean;
};

/** Layered glass wash + hairline — list-safe (no per-row BlurView). */
export function FrostedBalanceSurface({
  children,
  style,
  dotTexture = false,
  ...rest
}: FrostedBalanceSurfaceProps): ReactElement {
  const palette = useThemeColors();
  const cardRadius = radius['2xl'];

  return (
    <View
      {...rest}
      style={[
        {
          alignSelf: 'stretch',
          borderRadius: cardRadius,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.border,
          backgroundColor: palette.premiumCardSurface,
          overflow: 'hidden',
          ...platformShadow('xs'),
        },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { borderRadius: cardRadius, backgroundColor: palette.glass },
        ]}
      />
      {dotTexture ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { opacity: 0.85 }]}>
          <BalanceDotMatrixTexture dotColor={palette.textPrimary} />
        </View>
      ) : null}
      {children}
    </View>
  );
}
