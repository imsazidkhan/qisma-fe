import type { ReactElement, ReactNode } from 'react';
import { Text, View, type TextStyle } from 'react-native';

import { space, typography, useThemeColors } from '@/theme';

export type SectionLabelProps = {
  children: ReactNode;
  /** Right-aligned trailing element (e.g. an "Edit" link). */
  trailing?: ReactNode;
  /** Optional extra style on the text — caller controls margin. */
  style?: TextStyle;
};

/**
 * Mono uppercase kicker that sits above each section on the AddExpense screen.
 * Pairs with `RuleDivider` to keep the layout typographic, not chrome-heavy.
 */
export function SectionLabel({ children, trailing, style }: SectionLabelProps): ReactElement {
  const palette = useThemeColors();
  const text = (
    <Text
      style={[
        {
          fontFamily: typography.fontFamily.mono.regular,
          fontSize: typography.fontSize['2xs'],
          letterSpacing: typography.letterSpacing.widest,
          textTransform: 'uppercase',
          color: palette.textMuted,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );

  if (!trailing) return text;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: space.gap,
      }}
    >
      {text}
      {trailing}
    </View>
  );
}
