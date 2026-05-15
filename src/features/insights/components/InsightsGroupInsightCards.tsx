import type { ReactElement } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import type { InsightsMemberBar } from '@/features/insights/model/insightsDemoModel';
import { formatInsightsInr } from '@/features/insights/utils/insightsFormat';
import {
  layoutGrid,
  platformShadow,
  radius,
  space,
  textStyles,
  typography,
  useThemeColors,
} from '@/theme';

export type InsightsGroupInsightCardsProps = {
  members: (InsightsMemberBar & { roleLabel: string })[];
};

function pickCard(
  members: (InsightsMemberBar & { roleLabel: string })[],
  roleKey: string,
): (InsightsMemberBar & { roleLabel: string }) | undefined {
  return members.find((m) => m.roleTranslationKey === roleKey);
}

export function InsightsGroupInsightCards({
  members,
}: InsightsGroupInsightCardsProps): ReactElement {
  const palette = useThemeColors();
  const { width } = useWindowDimensions();
  const cardW = Math.min(188, Math.max(156, width * 0.46));

  const paid = pickCard(members, 'insights.group.paidMost');
  const owes = pickCard(members, 'insights.group.owesMost');
  const active = pickCard(members, 'insights.group.topContributor');
  const cards = [paid, owes, active].filter(
    (c): c is InsightsMemberBar & { roleLabel: string } => c !== undefined,
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: space.gapMd, paddingVertical: 2 }}
    >
      {cards.map((m) => (
        <View
          key={m.id}
          style={[
            platformShadow('xs'),
            {
              width: cardW,
              borderRadius: radius['2xl'],
            },
          ]}
        >
          <View
            style={[
              styles.card,
              {
                borderColor: palette.borderSubtle,
                backgroundColor: palette.surfaceElevated,
                borderRadius: radius['2xl'],
              },
            ]}
          >
            <View
              style={[
                styles.avatar,
                {
                  borderColor: palette.borderSubtle,
                  backgroundColor: palette.surfaceFloating,
                },
              ]}
            >
              <Text
                style={[
                  textStyles.labelSmall,
                  { color: palette.textPrimary, fontFamily: typography.fontFamily.mono.medium },
                ]}
              >
                {m.letter}
              </Text>
            </View>
            <Text style={[textStyles.label, { color: palette.textPrimary }]} numberOfLines={1}>
              {m.displayName}
            </Text>
            <Text
              style={[
                textStyles.captionSmall,
                {
                  color: palette.textMuted,
                  fontFamily: typography.fontFamily.mono.regular,
                  marginTop: layoutGrid.micro,
                },
              ]}
              numberOfLines={1}
            >
              {m.roleLabel}
            </Text>
            <View style={[styles.statRule, { backgroundColor: palette.borderSubtle }]} />
            <Text
              style={[
                textStyles.labelSmall,
                {
                  color: palette.textPrimary,
                  fontFamily: typography.fontFamily.mono.medium,
                  fontVariant: ['tabular-nums'],
                  marginTop: space.gapXs,
                },
              ]}
            >
              {formatInsightsInr(m.amountMinor)}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.gapMd,
    paddingVertical: space.gapMd,
    minHeight: 148,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.gapSm,
  },
  statRule: {
    height: StyleSheet.hairlineWidth,
    width: 32,
    marginTop: space.gapSm,
  },
});
