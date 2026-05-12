import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { space, typography, useThemeColors } from '@/theme';

/**
 * Mono step indicator: `01 ──── 02 ──── 03`. Pure typography + 1px hairline.
 *
 * - The active step renders in `textPrimary`.
 * - Past steps render in `textSecondary` (still visible, but subordinate).
 * - Future steps + their preceding hairlines render in `textMuted`.
 *
 * Hidden from a11y — it's decorative reinforcement of the screen's title.
 * The screen itself owns the spoken context ("Enter your mobile number" =
 * step 1, "Check your messages" = step 2).
 */

export type StepIndicatorProps = {
  /** Display labels, in order. e.g. `['01', '02']`. */
  labels: string[];
  /** 0-indexed active step. `-1` → all steps muted. */
  currentIndex: number;
};

export function StepIndicator({ labels, currentIndex }: StepIndicatorProps) {
  const palette = useThemeColors();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.row}
    >
      {labels.map((label, i) => {
        const isActive = i === currentIndex;
        const isPast = i < currentIndex;
        const labelColor = isActive
          ? palette.textPrimary
          : isPast
            ? palette.textSecondary
            : palette.textMuted;

        return (
          <Fragment key={`${label}-${i}`}>
            <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
            {i < labels.length - 1 && (
              <View
                style={[
                  styles.line,
                  {
                    backgroundColor:
                      i < currentIndex ? palette.textSecondary : palette.borderSubtle,
                  },
                ]}
              />
            )}
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
  },
  label: {
    fontFamily: typography.fontFamily.mono.regular,
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.widest,
    fontVariant: ['tabular-nums'],
  },
  line: {
    width: 24,
    height: 1,
  },
});
