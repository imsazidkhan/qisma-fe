import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { memo, useCallback, type ReactElement } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { profileScreenStyles as styles } from '@/features/profile/components/profileScreen.styles';
import { useThemeColors } from '@/theme';

export type ProfileSettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  /** `false` for rows that are purely informational trailing controls. */
  showChevron?: boolean;
};

/**
 * Settings row: icon+label (leading) vs value+chevron (trailing) with space-between.
 * Inner `View` is the horizontal flex row — avoids `Pressable` column quirks on web/Android.
 */
export const ProfileSettingsRow = memo(function ProfileSettingsRow({
  icon,
  label,
  value,
  onPress,
  accessibilityHint,
  style,
  showChevron = true,
}: ProfileSettingsRowProps): ReactElement {
  const palette = useThemeColors();

  const handlePress = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    onPress();
  }, [onPress]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityHint={accessibilityHint}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.rowPress,
        style,
        pressed ? { backgroundColor: palette.surfaceOverlay } : null,
      ]}
    >
      <View style={styles.rowInner}>
        <View style={styles.rowLeading}>
          <View style={[styles.rowIconBox, { backgroundColor: palette.surfaceRaised }]}>
            <Ionicons name={icon} size={22} color={palette.iconPrimary} />
          </View>
          <View style={styles.rowLabelWrap}>
            <Text style={[styles.rowLabel, { color: palette.textPrimary }]} numberOfLines={1}>
              {label}
            </Text>
          </View>
        </View>

        <View style={styles.rowTrailing}>
          {value ? (
            <View style={styles.rowValueWrap}>
              <Text
                style={[styles.rowValueInline, { color: palette.textSecondary }]}
                numberOfLines={1}
              >
                {value}
              </Text>
            </View>
          ) : null}
          <View style={styles.rowChevronWrap}>
            {showChevron ? (
              <Ionicons name="chevron-forward" size={22} color={palette.iconSecondary} />
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
});
