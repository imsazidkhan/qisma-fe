import * as Haptics from 'expo-haptics';
import type { ReactElement, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { opacity as opacityTokens, radius, size, space, typography, useThemeColors } from '@/theme';

export type FloatingCTAProps = {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  visual?: 'solid' | 'outline';
  /** Solid slab: accent (default) or ink (`palette.black`, white glyphs). */
  fill?: 'accent' | 'ink';
  /** Extra bottom inset (safe area + keyboard padding handled by parent). */
  style?: ViewStyle;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Quiet line under the label (e.g. explains the primary action). */
  subtitle?: string;
  /** Override the default `radius.md` corner — e.g. for hero / footer slabs. */
  borderRadius?: number;
};

export function FloatingCTA({
  label,
  accessibilityLabel,
  onPress,
  disabled = false,
  loading = false,
  visual = 'solid',
  fill = 'accent',
  style,
  leading,
  trailing,
  subtitle,
  borderRadius,
}: FloatingCTAProps): ReactElement {
  const palette = useThemeColors();
  const outline = visual === 'outline';

  const inactive = disabled && !loading;
  /** Disabled solid ink slab must stay visibly black vs a white/light footer (`surfaceRaised` reads invisible). */
  const inactiveInk = inactive && !outline && fill === 'ink';

  const labelColor = inactiveInk
    ? palette.white
    : inactive
      ? palette.textMuted
      : outline
        ? palette.accent
        : fill === 'ink'
          ? palette.white
          : palette.textOnAccent;

  const labelOpacity = inactiveInk ? opacityTokens.medium : 1;

  const labelRow = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.gapSm,
      }}
    >
      {leading}
      <Text
        style={{
          fontFamily: typography.fontFamily.mono.medium,
          fontSize: typography.fontSize.sm,
          letterSpacing: typography.letterSpacing.widest,
          textTransform: 'uppercase',
          color: labelColor,
          opacity: labelOpacity,
        }}
      >
        {label}
      </Text>
      {trailing}
    </View>
  );

  const plainLabel = (
    <Text
      style={{
        fontFamily: typography.fontFamily.mono.medium,
        fontSize: typography.fontSize.sm,
        letterSpacing: typography.letterSpacing.widest,
        textTransform: 'uppercase',
        color: labelColor,
        opacity: labelOpacity,
      }}
    >
      {label}
    </Text>
  );

  const subtitleBaseColor = inactiveInk
    ? palette.white
    : inactive
      ? palette.textMuted
      : outline
        ? palette.textSecondary
        : fill === 'ink'
          ? palette.white
          : palette.textOnAccent;

  const subtitleOpacity = inactiveInk
    ? opacityTokens.medium
    : inactive || outline
      ? 1
      : fill === 'ink'
        ? opacityTokens.high
        : opacityTokens.high;

  const inkSolidActive = !inactive && !outline && fill === 'ink';

  const subtitleNode =
    subtitle && !loading ? (
      <Text
        style={{
          marginTop: space.gapXs,
          fontFamily: typography.fontFamily.sans.regular,
          fontSize: typography.fontSize.xs,
          lineHeight: typography.fontSize.xs * 1.35,
          color: subtitleBaseColor,
          opacity: subtitleOpacity,
          textAlign: 'center',
        }}
      >
        {subtitle}
      </Text>
    ) : null;

  const borderedSlab =
    inactive || outline || inkSolidActive || inactiveInk ? StyleSheet.hairlineWidth : 0;

  const slabRadius = borderRadius ?? radius.md;
  const borderColorSolid = inactiveInk
    ? palette.borderStrong
    : inactive
      ? palette.borderStrong
      : inkSolidActive
        ? palette.borderStrong
        : 'transparent';

  /** Solid ink paints on a nested `View` — some RN/Android builds drop `Pressable` background fills. */
  if (!outline && fill === 'ink') {
    return (
      <View style={[style]} collapsable={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ disabled: disabled || loading, busy: loading }}
          disabled={disabled || loading}
          onPress={() => {
            void Haptics.selectionAsync().catch(() => {});
            onPress();
          }}
          style={({ pressed }) => ({
            opacity: pressed && !inactive ? 0.92 : 1,
          })}
        >
          <View
            style={{
              alignSelf: 'stretch',
              borderRadius: slabRadius,
              overflow: 'hidden',
              minHeight: size.touchMin,
              paddingVertical: space.gapMd + space.gapXs,
              paddingHorizontal: space.sectionGapSm,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: palette.black,
              borderWidth: borderedSlab,
              borderColor: borderColorSolid,
            }}
            collapsable={false}
          >
            {loading ? (
              <ActivityIndicator color={palette.white} />
            ) : (
              <View style={{ alignItems: 'center', alignSelf: 'stretch' }}>
                {leading != null || trailing != null ? labelRow : plainLabel}
                {subtitleNode}
              </View>
            )}
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[style]} collapsable={false}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        disabled={disabled || loading}
        onPress={() => {
          void Haptics.selectionAsync().catch(() => {});
          onPress();
        }}
        style={({ pressed }) => ({
          borderRadius: slabRadius,
          minHeight: size.touchMin,
          paddingVertical: space.gapMd + space.gapXs,
          paddingHorizontal: space.sectionGapSm,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed && !inactive ? 0.92 : 1,
          backgroundColor: inactive
            ? inactiveInk
              ? palette.black
              : palette.surfaceRaised
            : outline
              ? palette.surfaceFloating
              : palette.accent,
          borderWidth: borderedSlab,
          borderColor: inactiveInk
            ? palette.borderStrong
            : inactive
              ? palette.borderStrong
              : outline
                ? palette.accent
                : inkSolidActive
                  ? palette.borderStrong
                  : 'transparent',
        })}
      >
        {loading ? (
          <ActivityIndicator
            color={outline ? palette.accent : fill === 'ink' ? palette.white : palette.textOnAccent}
          />
        ) : (
          <View style={{ alignItems: 'center', alignSelf: 'stretch' }}>
            {leading != null || trailing != null ? labelRow : plainLabel}
            {subtitleNode}
          </View>
        )}
      </Pressable>
    </View>
  );
}
