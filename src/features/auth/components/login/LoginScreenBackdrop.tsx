import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { useThemeColors } from '@/theme';

/**
 * Nothing-style auth canvas: near-flat tonal wash only — no grain, no depth tricks.
 */
export function LoginScreenBackdrop() {
  const palette = useThemeColors();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[palette.canvasGradientStart, palette.background]}
        locations={[0, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
