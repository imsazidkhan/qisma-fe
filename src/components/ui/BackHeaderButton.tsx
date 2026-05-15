import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { type ReactElement } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { size, space, useThemeColors } from '@/theme';

export type BackHeaderButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  /** Outline chevron + softer ink — premium headers (e.g. expense detail). */
  thinGlyph?: boolean;
};

/** Minimal chevron-back control for screen headers (matches create-group affordance). */
export function BackHeaderButton({
  onPress,
  accessibilityLabel,
  style,
  thinGlyph = false,
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
          marginLeft: thinGlyph ? 0 : -space.gapSm,
          padding: space.gapSm,
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: size.touchMin,
          minHeight: size.touchMin,
        },
        style,
      ]}
    >
      <Ionicons
        color={thinGlyph ? palette.iconSecondary : palette.iconPrimary}
        name={thinGlyph ? 'chevron-back-outline' : 'chevron-back'}
        size={thinGlyph ? size.icon : 26}
      />
    </Pressable>
  );
}
