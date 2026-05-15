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
  /**
   * `default` — inverted active slab (`textPrimary` fill + `textInverse` label).
   * `compact` — utility chrome for dense hubs.
   * `auth` — minimal segmented control: ink pill on active, low-contrast chrome.
   */
  variant?: 'default' | 'compact' | 'auth';
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
  const auth = variant === 'auth';

  return (
    <View
      style={[
        styles.track,
        compact ? styles.trackCompact : null,
        auth ? styles.trackAuth : null,
        {
          borderColor: auth
            ? palette.borderSubtle
            : compact
              ? palette.borderDivider
              : palette.border,
          backgroundColor: 'transparent',
        },
      ]}
    >
      {OPTIONS.map((opt) => {
        const active = preference === opt.value;
        const segmentBg = auth
          ? active
            ? palette.textPrimary
            : 'transparent'
          : compact
            ? active
              ? palette.overlayStrong
              : 'transparent'
            : active
              ? palette.textPrimary
              : 'transparent';
        const labelColor = auth
          ? active
            ? palette.textInverse
            : palette.textMuted
          : compact
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
              auth ? styles.segmentAuth : compact ? styles.segmentCompact : styles.segment,
              { backgroundColor: segmentBg },
            ]}
          >
            <Text
              style={[
                auth ? styles.labelAuth : compact ? styles.labelCompact : styles.label,
                compact && active && !auth ? styles.labelCompactActive : null,
                auth && active ? styles.labelAuthActive : null,
                { color: labelColor, opacity: auth && !active ? 0.72 : 1 },
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
  trackAuth: {
    borderRadius: radius.md,
    padding: 1,
    borderWidth: StyleSheet.hairlineWidth,
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
  segmentAuth: {
    paddingVertical: spacing['1'],
    paddingHorizontal: spacing['2'],
    borderRadius: radius.sm,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  labelAuth: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.wider,
  },
  labelAuthActive: {
    fontFamily: typography.fontFamily.mono.medium,
  },
  labelCompactActive: {
    fontFamily: typography.fontFamily.mono.medium,
  },
});
