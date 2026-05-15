import { type ReactElement, type ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { size } from '@/theme';

export type HeaderIconButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  disabled?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Compact header action — matches {@link BackHeaderButton} hit slop (12). */
export function HeaderIconButton({
  onPress,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  children,
  style,
}: HeaderIconButtonProps): ReactElement {
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minWidth: size.touchMin,
          minHeight: size.touchMin,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
        { opacity: disabled ? 0.38 : pressed ? 0.72 : 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}
