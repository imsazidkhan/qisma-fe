import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { opacity, space, useThemeColors } from '@/theme';

export type DotMatrixFieldProps = {
  /** Dot diameter in dp — defaults to 2. */
  dotSize?: number;
  /** Vertical gap between dot centers. */
  rowGap?: number;
  /** Horizontal gap between dot centers. */
  colGap?: number;
  /** Approximate height of the pattern area. */
  height?: number;
  /** Columns (dots wide). */
  columns?: number;
  /** Rows (dots tall). */
  rows?: number;
};

/**
 * Restrained “Nothing-style” grid accent — monochrome, no animation (respects reduced motion by staying static).
 */
export function DotMatrixField({
  dotSize = 2,
  rowGap = 7,
  colGap = 7,
  height = 72,
  columns = 18,
  rows = 8,
}: DotMatrixFieldProps): ReactElement {
  const palette = useThemeColors();

  const dots = useMemo(() => {
    const out: { key: string; on: boolean }[] = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < columns; c += 1) {
        const stagger = (r + c) % 3 === 0;
        out.push({ key: `${r}-${c}`, on: stagger });
      }
    }
    return out;
  }, [columns, rows]);

  return (
    <View
      style={[styles.wrap, { height }]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <View style={[styles.grid, { gap: rowGap, columnGap: colGap }]}>
        {dots.map((d) => (
          <View
            key={d.key}
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: d.on ? palette.textMuted : palette.borderFrost,
                opacity: d.on ? opacity.high : opacity.subtle,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%' as const,
    paddingVertical: space.gapSm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  dot: {},
});
