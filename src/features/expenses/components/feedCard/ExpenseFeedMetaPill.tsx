import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { borderWidth, radius, size, spacing, typography, useThemeColors } from '@/theme';

export type ExpenseFeedMetaPillTone = 'default' | 'ledger';

export type ExpenseFeedMetaPillProps =
  | {
      tone?: ExpenseFeedMetaPillTone;
      label: string;
      icon?: ComponentProps<typeof Ionicons>['name'];
      accessibilityLabel?: string;
      children?: undefined;
    }
  | {
      tone?: ExpenseFeedMetaPillTone;
      label?: undefined;
      icon?: undefined;
      accessibilityLabel?: string;
      children: ReactNode;
    };

/** Compact metadata chip — outlined slab, ledger-caption rhythm; supports plain label or rich `children`. */
export function ExpenseFeedMetaPill(props: ExpenseFeedMetaPillProps): ReactElement {
  const palette = useThemeColors();
  const tone = props.tone ?? 'default';

  const labelInk = tone === 'ledger' ? palette.expenseLedgerMetaInk : palette.textMuted;
  const iconInk = tone === 'ledger' ? palette.expenseLedgerMetaInk : palette.iconMuted;

  const resolvedA11y =
    props.accessibilityLabel ?? (props.children === undefined ? props.label : undefined);

  const borderedBody =
    props.children !== undefined ? (
      props.children
    ) : (
      <>
        {props.icon ? (
          <Ionicons
            name={props.icon}
            size={size.iconSm}
            color={iconInk}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        ) : null}
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.labelText, { color: labelInk }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {props.label}
        </Text>
      </>
    );

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={resolvedA11y}
      style={[
        styles.shell,
        {
          borderColor: palette.expenseFeedMetaChipBorder,
          backgroundColor: palette.expenseFeedMetaChipSurface,
        },
      ]}
    >
      {borderedBody}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: spacing['1'],
    paddingVertical: spacing['1.5'],
    paddingHorizontal: spacing['2'],
    borderRadius: radius.full,
    borderWidth: borderWidth.hairline,
    overflow: 'hidden',
  },
  labelText: {
    flexShrink: 1,
    fontFamily: typography.fontFamily.sans.medium,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    lineHeight: spacing['4'],
    letterSpacing: typography.letterSpacing.ledgerCaption,
  },
});
