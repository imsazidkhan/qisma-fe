import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

export type BalanceDotMatrixTextureProps = {
  dotColor: string;
};

/** Sparse dot grid for matte balance surfaces — Nothing-style micro texture. */
export function BalanceDotMatrixTexture({ dotColor }: BalanceDotMatrixTextureProps): ReactElement {
  const patternId = useMemo(() => `balDots_${Math.random().toString(36).slice(2, 11)}`, []);
  const step = 9;
  const r = 0.65;

  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Defs>
        <Pattern id={patternId} width={step} height={step} patternUnits="userSpaceOnUse">
          <Circle cx={step * 0.28} cy={step * 0.28} r={r} fill={dotColor} opacity={0.11} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </Svg>
  );
}
