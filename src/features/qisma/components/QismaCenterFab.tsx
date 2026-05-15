import * as Haptics from 'expo-haptics';
import { memo, useCallback, type ReactElement } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { QismaPlusGlyphIcon } from '@/features/qisma/components/QismaTabGlyphIcons';
import { QISMA_TAB_BAR_LAYOUT } from '@/features/qisma/constants/tabBarLayout';
import { duration, radius, useThemeColors, useThemeMode, zIndex } from '@/theme';

export type QismaCenterFabProps = {
  active: boolean;
  onPress: () => void;
  reduceMotion: boolean;
};

const FAB_TIMING = Easing.inOut(Easing.ease);

/** Matte disk + plus — restrained elevation for Lastbench floating rail. */
function QismaCenterFabInner({ active, onPress, reduceMotion }: QismaCenterFabProps): ReactElement {
  const palette = useThemeColors();
  const mode = useThemeMode();
  const pressed = useSharedValue(0);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPress();
  }, [onPress]);

  const handlePressIn = useCallback(() => {
    if (reduceMotion) return;
    pressed.value = withTiming(1, {
      duration: duration.fast.ms,
      easing: FAB_TIMING,
    });
  }, [pressed, reduceMotion]);

  const handlePressOut = useCallback(() => {
    if (reduceMotion) return;
    pressed.value = withTiming(0, {
      duration: duration.normal.ms,
      easing: FAB_TIMING,
    });
  }, [pressed, reduceMotion]);

  const fabBg = mode === 'light' ? palette.floatingTabInkActive : palette.black;
  const fabIcon = mode === 'light' ? palette.white : palette.textPrimary;
  const fabRing = mode === 'light' ? palette.white : palette.borderSubtle;

  const floatStyle = useAnimatedStyle(() => {
    const lift = active ? 1.004 : 1;
    const pressScale = interpolate(pressed.value, [0, 1], [1, 0.97]);
    return {
      transform: [{ scale: lift * pressScale }],
    };
  }, [active, pressed]);

  const glowStyle = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(
        pressed.value,
        [0, 1],
        [
          'rgba(255,255,255,0)',
          mode === 'light' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.12)',
        ],
      ),
    }),
    [mode],
  );

  const fabDiameter = QISMA_TAB_BAR_LAYOUT.fabSize;

  const iosShadow =
    mode === 'light'
      ? {
          shadowColor: palette.shadow,
          shadowOffset: { width: 0, height: 9 },
          shadowOpacity: 0.084,
          shadowRadius: 17,
        }
      : {
          shadowColor: palette.shadow,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.27,
          shadowRadius: 14,
        };

  return (
    <Animated.View
      style={[
        floatStyle,
        {
          zIndex: zIndex.sticky,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add expense"
        accessibilityHint="Opens groups so you can choose where to log a split"
        accessibilityState={{ selected: active }}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
        android_ripple={{ color: palette.overlayMedium, borderless: false, foreground: true }}
        style={[
          styles.disk,
          {
            width: fabDiameter,
            height: fabDiameter,
            borderRadius: radius.full,
            backgroundColor: fabBg,
            borderColor: fabRing,
            ...Platform.select({
              ios: iosShadow,
              android: {
                elevation: mode === 'light' ? (active ? 3 : 4) : active ? 7 : 8,
              },
              default: {
                shadowColor: palette.shadow,
                shadowOffset: { width: 0, height: 9 },
                shadowOpacity: mode === 'light' ? 0.084 : 0.2,
                shadowRadius: 16,
              },
            }),
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.glowDisk, glowStyle]}
        />
        <View style={styles.glyphLayer} pointerEvents="none">
          <View style={styles.plusOpticalNudge}>
            <QismaPlusGlyphIcon color={fabIcon} size={20} strokeWidth={1.5} />
          </View>
        </View>
        {active ? (
          <View pointerEvents="none" style={[styles.ring, { borderColor: palette.borderStrong }]} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  disk: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'visible',
  },
  glowDisk: {
    borderRadius: radius.full,
  },
  glyphLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusOpticalNudge: {
    transform: [{ translateX: 0.5 }, { translateY: 0.5 }],
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.full,
    borderWidth: 2,
    margin: -2,
    opacity: 0.35,
  },
});

export const QismaCenterFab = memo(function QismaCenterFab(
  props: QismaCenterFabProps,
): ReactElement {
  return <QismaCenterFabInner {...props} />;
});
