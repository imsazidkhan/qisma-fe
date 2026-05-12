import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { type ReactElement } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { size, space, useThemeColors } from '@/theme';

export type BackHeaderButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

/** Minimal chevron-back control for screen headers (matches create-group affordance). */
export function BackHeaderButton({
  onPress,
  accessibilityLabel,
  style,
}: BackHeaderButtonProps): ReactElement {
  const palette = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      hitSlop={12}
      style={[
        {
          alignSelf: 'flex-start',
          marginLeft: -space.gapSm,
          padding: space.gapSm,
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: size.touchMin,
          minHeight: size.touchMin,
        },
        style,
      ]}
    >
      <Ionicons name="chevron-back" size={26} color={palette.iconPrimary} />
    </Pressable>
  );
}
