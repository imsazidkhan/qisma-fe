import type { ReactElement } from 'react';
import { Text, View } from 'react-native';

import { expenseDetailScreenStyles as styles } from '@/features/expenses/screens/expenseDetailScreen.styles';
import { layoutGrid, textStyles, useThemeColors } from '@/theme';

export type ExpenseDetailLooseRowListProps = {
  rows: Record<string, unknown>[];
  emptyLabel: string;
  renderPrimary: (row: Record<string, unknown>) => string | undefined;
  renderSecondary?: (row: Record<string, unknown>) => string | undefined;
};

export function ExpenseDetailLooseRowList({
  rows,
  emptyLabel,
  renderPrimary,
  renderSecondary,
}: ExpenseDetailLooseRowListProps): ReactElement {
  const palette = useThemeColors();

  if (rows.length === 0) {
    return (
      <Text style={[textStyles.captionSmall, { color: palette.textMuted }]}>{emptyLabel}</Text>
    );
  }

  return (
    <View style={{ gap: layoutGrid.sm, alignSelf: 'stretch' }}>
      {rows.map((row, index) => {
        const primary = renderPrimary(row);
        const secondary = renderSecondary?.(row);
        const key = `${index}-${primary ?? 'row'}`;
        return (
          <View
            key={key}
            style={[
              styles.cardRow,
              { borderColor: palette.borderSubtle, backgroundColor: palette.surfaceElevated },
            ]}
          >
            {primary ? (
              <Text style={[textStyles.body, { color: palette.textPrimary }]}>{primary}</Text>
            ) : null}
            {secondary ? (
              <Text style={[styles.monoMeta, { color: palette.textMuted }]}>{secondary}</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
