import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { memo, useCallback, type ReactElement } from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { QismaPlusGlyphIcon } from '@/features/qisma/components/QismaTabGlyphIcons';
import { QISMA_TAB_BAR_LAYOUT } from '@/features/qisma/constants/tabBarLayout';
import { radius, spacing, useThemeMode } from '@/theme';

export type QismaCenterFabProps = {
  selected: boolean;
  onPress: () => void;
  palette: {
    accent: string;
    accentSoft: string;
    textOnAccent: string;
    accentPress: string;
    border: string;
  };
  /** Reserved for parity with side tabs; press feedback uses RN `Pressable` styles only. */
  reduceMotion: boolean;
};

function QismaCenterFabInner({ selected, onPress, palette }: QismaCenterFabProps): ReactElement {
  const mode = useThemeMode();

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPress();
  }, [onPress]);

  const glowStyle: ViewStyle =
    Platform.OS === 'ios'
      ? {
          shadowColor: palette.accent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.45,
          shadowRadius: 14,
        }
      : {
          elevation: 6,
        };

  const fabDiameter = QISMA_TAB_BAR_LAYOUT.fabSize;
  const selectedBump = selected ? 1.03 : 1;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Start a new split"
      accessibilityHint="Opens the create flow for a shared expense"
      accessibilityState={{ selected }}
      onPress={handlePress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      android_ripple={{ color: palette.accentSoft, borderless: false, foreground: true }}
      style={({ pressed }) => [
        {
          width: fabDiameter,
          height: fabDiameter,
          borderRadius: radius.fab,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.border,
          ...glowStyle,
          transform: [{ scale: (pressed ? 0.93 : 1) * selectedBump }],
          opacity: pressed ? 0.96 : 1,
        },
      ]}
    >
      <BlurView
        intensity={40}
        tint={mode === 'dark' ? 'dark' : 'light'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: palette.accent,
            opacity: 1,
          },
        ]}
      />
      <View
        style={[
          styles.glyphLayer,
          {
            backgroundColor: selected ? palette.accentPress : 'transparent',
            paddingTop: spacing['0.5'],
          },
        ]}
        pointerEvents="none"
      >
        <QismaPlusGlyphIcon color={palette.textOnAccent} size={30} strokeWidth={1.85} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glyphLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const QismaCenterFab = memo(function QismaCenterFab(
  props: QismaCenterFabProps,
): ReactElement {
  return <QismaCenterFabInner {...props} />;
});
