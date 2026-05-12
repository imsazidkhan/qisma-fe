import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { borderWidth, radius, size, space, typography, useThemeColors } from '@/theme';

export type AddPersonButtonProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
};

/**
 * Outlined CTA at the bottom of the People list: dotted on iOS, dashed on
 * Android (Yoga does not render dotted borders reliably on Android). Border
 * lives on a plain `View` with `collapsable={false}` so the outline is not
 * optimized away; `Pressable` is borderless inside.
 */
export function AddPersonButton({
  label,
  onPress,
  accessibilityLabel,
}: AddPersonButtonProps): ReactElement {
  const palette = useThemeColors();
  const outlineStyle = Platform.OS === 'ios' ? ('dotted' as const) : ('dashed' as const);

  return (
    <View
      collapsable={false}
      style={{
        alignSelf: 'stretch',
        borderRadius: radius.xl,
        borderWidth: borderWidth.thin,
        borderStyle: outlineStyle,
        borderColor: palette.borderStrong,
        backgroundColor: palette.white,
        overflow: 'hidden',
        paddingVertical: space.gapMd,
        paddingHorizontal: space.paddingMd,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={() => {
          void Haptics.selectionAsync().catch(() => {});
          onPress();
        }}
        style={({ pressed }) => ({
          alignSelf: 'stretch',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'nowrap',
            alignItems: 'center',
            gap: space.gapSm,
            maxWidth: '100%',
          }}
        >
          <View style={{ flexShrink: 0 }}>
            <Ionicons
              accessibilityElementsHidden
              name="add"
              size={size.iconSm}
              color={palette.textPrimary}
            />
          </View>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              flexShrink: 1,
              minWidth: 0,
              fontFamily: typography.fontFamily.sans.medium,
              fontSize: typography.fontSize.sm,
              color: palette.textPrimary,
              letterSpacing: typography.letterSpacing.wide,
            }}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
