import { BlurView } from 'expo-blur';
import type { ReactElement } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { DotMatrixField } from '@/features/invites/components/DotMatrixField';
import {
  platformShadow,
  radius,
  space,
  textStyles,
  typography,
  useThemeColors,
  useThemeMode,
} from '@/theme';

export type InsightsWrappedCtaProps = {
  title: string;
  subtitle: string;
  previewLine: string;
  onPress?: () => void;
};

export function InsightsWrappedCta({
  title,
  subtitle,
  previewLine,
  onPress,
}: InsightsWrappedCtaProps): ReactElement {
  const palette = useThemeColors();
  const mode = useThemeMode();
  const tint = mode === 'dark' ? 'dark' : 'light';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed && onPress ? 0.92 : 1 }]}
    >
      <View style={[platformShadow('premiumCard'), { borderRadius: radius['3xl'] }]}>
        <View
          style={[
            styles.shell,
            {
              borderColor: palette.borderSubtle,
              borderRadius: radius['3xl'],
              overflow: 'hidden',
            },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={28} tint={tint} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.surfaceElevated }]} />
          )}
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: palette.glassStrong, opacity: mode === 'dark' ? 0.3 : 0.5 },
            ]}
          />
          <View style={styles.matrixClip} pointerEvents="none">
            <DotMatrixField colGap={7} columns={24} dotSize={2} height={88} rowGap={7} rows={6} />
          </View>
          <View style={styles.inner}>
            <Text
              style={[
                textStyles.h2,
                {
                  color: palette.textPrimary,
                  fontFamily: typography.fontFamily.sans.semiBold,
                  letterSpacing: typography.letterSpacing.tight,
                  marginBottom: space.gapSm,
                },
              ]}
            >
              {title}
            </Text>
            <Text
              style={[
                textStyles.caption,
                { color: palette.textSecondary, marginBottom: space.gap },
              ]}
            >
              {subtitle}
            </Text>
            <Text
              style={[
                textStyles.captionSmall,
                {
                  color: palette.textMuted,
                  fontFamily: typography.fontFamily.mono.regular,
                  fontVariant: ['tabular-nums'],
                },
              ]}
            >
              {previewLine}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 168,
    position: 'relative',
  },
  matrixClip: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
    overflow: 'hidden',
  },
  inner: {
    paddingHorizontal: space.paddingLg,
    paddingVertical: space.paddingLg,
  },
});
