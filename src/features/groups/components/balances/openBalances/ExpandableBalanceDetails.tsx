import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { SettleActionRow } from '@/features/groups/components/balances/openBalances/SettleActionRow';
import { SoftDivider } from '@/features/groups/components/balances/openBalances/SoftDivider';
import { parseRelationshipHintsFromDisplayText } from '@/features/groups/utils/parseRelationshipHintsFromDisplayText';
import { duration, easing, space, textStyles, typography, useThemeColors } from '@/theme';

export type ExpandableBalanceDetailsProps = {
  counterpartyName: string;
  directionLine: string;
  displayText: string;
  hintLeadLabel: string;
  settleLabel: string;
  settleA11y: string;
  activityLabel: string;
  expenseLabel: string;
  insetLeft: number;
  onSettle: () => void;
  onActivity: () => void;
  onExpense: () => void;
};

export function ExpandableBalanceDetails({
  counterpartyName,
  directionLine,
  displayText,
  hintLeadLabel,
  settleLabel,
  settleA11y,
  activityLabel,
  expenseLabel,
  insetLeft,
  onSettle,
  onActivity,
  onExpense,
}: ExpandableBalanceDetailsProps): ReactElement {
  const palette = useThemeColors();
  const hints = parseRelationshipHintsFromDisplayText(displayText);

  const fire = (): void => {
    void Haptics.selectionAsync().catch(() => {});
  };

  return (
    <Animated.View
      entering={FadeIn.duration(duration.moderate.ms).easing(easing.standard.rn)}
      exiting={FadeOut.duration(duration.fast.ms).easing(easing.exit.rn)}
      style={[styles.shell, { paddingLeft: insetLeft }]}
    >
      <SoftDivider insetLeft={0} />

      <Text style={[styles.lede, { color: palette.textPrimary }]} accessibilityRole="header">
        {counterpartyName}
      </Text>
      <Text style={[styles.direction, { color: palette.textSecondary }]}>{directionLine}</Text>

      {hints.length > 0 ? (
        <View style={styles.hintBlock}>
          <Text style={[styles.hintKicker, { color: palette.textMuted }]}>{hintLeadLabel}</Text>
          {hints.map((h, i) => (
            <Text
              key={`${i}:${h.slice(0, 24)}`}
              style={[styles.hintLine, { color: palette.textSecondary }]}
              numberOfLines={2}
            >
              • {h}
            </Text>
          ))}
        </View>
      ) : displayText.trim().length > 0 ? (
        <Text style={[styles.fallbackBody, { color: palette.textMuted }]} numberOfLines={6}>
          {displayText.trim()}
        </Text>
      ) : null}

      <SettleActionRow label={settleLabel} accessibilityLabel={settleA11y} onPress={onSettle} />

      <View style={styles.secondaryRow}>
        <GhostLink
          label={activityLabel}
          onPress={() => {
            fire();
            onActivity();
          }}
        />
        <Text
          style={[styles.secondarySep, { color: palette.textMuted }]}
          accessibilityElementsHidden
        >
          ·
        </Text>
        <GhostLink
          label={expenseLabel}
          onPress={() => {
            fire();
            onExpense();
          }}
        />
      </View>
    </Animated.View>
  );
}

function GhostLink({ label, onPress }: { label: string; onPress: () => void }): ReactElement {
  const palette = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }]}
    >
      <Text style={[styles.ghost, { color: palette.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: 'stretch',
    paddingBottom: space.gapMd,
    paddingRight: 0,
    gap: space.gapSm,
    marginTop: space.gapXs,
  },
  lede: {
    ...textStyles.body,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.sans.semiBold,
    marginTop: space.gapSm,
  },
  direction: {
    ...textStyles.body,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.sans.medium,
  },
  hintBlock: {
    gap: space.gapXs / 2,
    alignSelf: 'stretch',
    marginTop: space.gapXs,
  },
  hintKicker: {
    ...textStyles.overline,
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.screenSection,
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: space.gapXs / 2,
  },
  hintLine: {
    ...textStyles.body,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  fallbackBody: {
    ...textStyles.body,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    marginTop: space.gapXs,
  },
  secondaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.gapSm,
    marginTop: space.gapSm,
  },
  secondarySep: {
    ...textStyles.captionSmall,
    fontFamily: typography.fontFamily.mono.regular,
  },
  ghost: {
    ...textStyles.captionSmall,
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },
});
