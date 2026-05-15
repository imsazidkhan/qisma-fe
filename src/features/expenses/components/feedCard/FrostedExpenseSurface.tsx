import type { ReactElement } from 'react';
import { View, type ViewProps } from 'react-native';

import { borderWidth, platformShadow, radius, useThemeColors } from '@/theme';

export type FrostedExpenseSurfaceProps = ViewProps & {
  children: React.ReactNode;
  /** Hover lift — stronger ambient slab (desktop pointer / tablet hover). */
  elevated?: boolean;
};

/** Quiet wallet slab — soft ambient shadow only (no sheen layer — reads calmer on dense feeds). */
export function FrostedExpenseSurface({
  children,
  elevated = false,
  style,
  ...rest
}: FrostedExpenseSurfaceProps): ReactElement {
  const palette = useThemeColors();
  const cardRadius = radius.expenseLedgerCard;

  return (
    <View
      {...rest}
      style={[
        {
          alignSelf: 'stretch',
          borderRadius: cardRadius,
          borderWidth: borderWidth.hairline,
          borderColor: palette.expenseLedgerCardHairline,
          backgroundColor: palette.cardBackground,
          overflow: 'hidden',
          ...platformShadow(elevated ? 'expenseLedgerCardHover' : 'expenseLedgerCard'),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
