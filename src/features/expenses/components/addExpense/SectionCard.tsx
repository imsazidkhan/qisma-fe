import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactElement, ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { radius, space, typography, useThemeColors } from '@/theme';

export type SectionCardProps = {
  /** Mono uppercase kicker shown at the top of the card. */
  kicker?: string;
  /** Optional trailing element on the kicker row (e.g. a count, "Edit" link). */
  kickerTrailing?: ReactNode;
  /** Card body. Lay out children with `gap` / `flexDirection`. */
  children: ReactNode;
  /** When set, the whole card becomes touchable and renders a chevron on the right. */
  onPress?: () => void;
  /** Hides the chevron even when `onPress` is set. */
  hideChevron?: boolean;
  /**
   * Render a chevron on the right even when the card is not pressable. Use for
   * cards that contain their own focusable input (TextInput) but should still
   * advertise the "edit" affordance visually.
   */
  decorativeChevron?: boolean;
  /** Show a hairline error tint on the border when validation fails. */
  hasError?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Inner padding override for special cases. Defaults to `space.gapMd`. */
  contentStyle?: ViewStyle;
};

/**
 * Rounded shell with hairline border and `palette.white` fill (Nothing-style
 * fields on ink canvas).
 * Used on Add Expense sections; optional `onPress` wraps `Pressable` and can show a chevron.
 */
export function SectionCard({
  kicker,
  kickerTrailing,
  children,
  onPress,
  hideChevron = false,
  decorativeChevron = false,
  hasError = false,
  accessibilityLabel,
  accessibilityHint,
  contentStyle,
}: SectionCardProps): ReactElement {
  const palette = useThemeColors();

  const interactive = typeof onPress === 'function';
  const showChevron = !hideChevron && (interactive || decorativeChevron);

  const inner = (
    <View
      style={[
        {
          paddingVertical: space.paddingMd,
          paddingHorizontal: space.paddingMd,
          gap: space.gap,
        },
        contentStyle,
      ]}
    >
      {kicker ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: space.gap,
          }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.mono.regular,
              fontSize: typography.fontSize['2xs'],
              letterSpacing: typography.letterSpacing.widest,
              textTransform: 'uppercase',
              color: palette.textMuted,
            }}
          >
            {kicker}
          </Text>
          {kickerTrailing}
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: space.gapMd,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
        {showChevron ? (
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              alignSelf: 'center',
              flexShrink: 0,
            }}
          >
            <Ionicons name="chevron-forward" size={18} color={palette.iconMuted} />
          </View>
        ) : null}
      </View>
    </View>
  );

  const cardStyle: ViewStyle = {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: hasError ? palette.warningBorder : palette.border,
    backgroundColor: palette.white,
    overflow: 'hidden',
  };

  const pressableRipple = Platform.OS === 'android' ? null : undefined;

  if (!interactive) {
    return <View style={cardStyle}>{inner}</View>;
  }

  return (
    <View style={cardStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        android_ripple={pressableRipple}
        onPress={() => {
          void Haptics.selectionAsync().catch(() => {});
          onPress?.();
        }}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        {inner}
      </Pressable>
    </View>
  );
}
