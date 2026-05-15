import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { duration, easing, useThemeColors } from '@/theme';
import { addGroupMemberModalStyles as panelStyles } from '@/features/groups/components/addGroupMemberModal.styles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type AddButtonMorphProps = {
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
  labelAdd: string;
  labelAdded: string;
  accessibilityLabel: string;
};

export function AddButtonMorph({
  selected,
  disabled,
  onToggle,
  labelAdd,
  labelAdded,
  accessibilityLabel,
}: AddButtonMorphProps): ReactElement {
  const palette = useThemeColors();
  const morph = useSharedValue(selected ? 1 : 0);
  const press = useSharedValue(0);

  useEffect(() => {
    morph.value = withTiming(selected ? 1 : 0, {
      duration: duration.normal.ms,
      easing: easing.standard.rn,
    });
  }, [selected, morph]);

  const shellStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: 1 - 0.04 * press.value }],
      borderColor: interpolateColor(
        morph.value,
        [0, 1],
        [palette.borderStrong, palette.borderFocus],
      ),
      backgroundColor: interpolateColor(
        morph.value,
        [0, 1],
        [palette.surfaceFloating, palette.accentSoft],
      ),
      minWidth: interpolate(morph.value, [0, 1], [88, 100]),
    }),
    [palette.accentSoft, palette.borderFocus, palette.borderStrong, palette.surfaceFloating],
  );

  const fadeAdd = useAnimatedStyle(() => ({ opacity: 1 - morph.value }));
  const fadeAdded = useAnimatedStyle(() => ({ opacity: morph.value }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPressIn={() => {
        press.value = withTiming(1, { duration: duration.fast.ms, easing: easing.standard.rn });
      }}
      onPressOut={() => {
        press.value = withTiming(0, { duration: duration.fast.ms, easing: easing.standard.rn });
      }}
      onPress={() => {
        if (disabled) return;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
      }}
      style={[
        panelStyles.rowAction,
        {
          overflow: 'hidden',
          paddingHorizontal: 0,
          alignItems: 'center',
          justifyContent: 'center',
        },
        shellStyle,
      ]}
    >
      <View style={styles.slot}>
        <Animated.View style={[styles.absLayer, fadeAdd]}>
          <Text style={[panelStyles.rowActionLabel, { color: palette.textPrimary }]}>
            {labelAdd}
          </Text>
        </Animated.View>
        <Animated.View style={[styles.absLayer, fadeAdded]}>
          <Ionicons name="checkmark" size={14} color={palette.textPrimary} />
          <Text style={[panelStyles.rowActionLabel, { color: palette.textPrimary }]}>
            {labelAdded}
          </Text>
        </Animated.View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: '100%',
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  absLayer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
