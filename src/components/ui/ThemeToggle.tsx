import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  radius,
  space,
  spacing,
  typography,
  type ThemePreference,
  useThemeColors,
  useThemePreference,
} from '@/theme';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'AUTO' },
  { value: 'light', label: 'LIGHT' },
  { value: 'dark', label: 'DARK' },
];

export type ThemeToggleProps = {
  /** `compact` reads as a utility control on dense hubs (e.g. Groups). */
  variant?: 'default' | 'compact';
};

/**
 * Three-way segmented control for the theme preference.
 *
 * Default: inverted active slab (`textPrimary` fill + `textInverse` label).
 * Compact (hub chrome): subtle tinted active segment — same geometry, lower contrast,
 * reads as utility chrome rather than a second hero control.
 */
export function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const palette = useThemeColors();
  const [preference, setPreference] = useThemePreference();
  const compact = variant === 'compact';

  return (
    <View
      style={[
        styles.track,
        compact ? styles.trackCompact : null,
        {
          borderColor: compact ? palette.borderDivider : palette.border,
        },
      ]}
    >
      {OPTIONS.map((opt) => {
        const active = preference === opt.value;
        const segmentBg = compact
          ? active
            ? palette.overlayStrong
            : 'transparent'
          : active
            ? palette.textPrimary
            : 'transparent';
        const labelColor = compact
          ? active
            ? palette.textPrimary
            : palette.textMuted
          : active
            ? palette.textInverse
            : palette.textSecondary;
        return (
          <Pressable
            key={opt.value}
            onPress={() => setPreference(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Use ${opt.label.toLowerCase()} theme`}
            style={[
              compact ? styles.segmentCompact : styles.segment,
              { backgroundColor: segmentBg },
            ]}
          >
            <Text
              style={[
                compact ? styles.labelCompact : styles.label,
                compact && active ? styles.labelCompactActive : null,
                { color: labelColor },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: 2,
  },
  trackCompact: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 1,
    borderRadius: radius.xs,
  },
  segment: {
    paddingVertical: space.gapSm,
    paddingHorizontal: space.padding,
    borderRadius: radius.xs,
  },
  segmentCompact: {
    paddingVertical: spacing['1'],
    paddingHorizontal: spacing['1'],
    borderRadius: radius.xs,
  },
  label: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.widest,
  },
  labelCompact: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.wide,
  },
  labelCompactActive: {
    fontFamily: typography.fontFamily.mono.medium,
  },
});
