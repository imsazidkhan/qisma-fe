import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { InsightsMemberBar } from '@/features/insights/model/insightsDemoModel';
import { formatInsightsInr } from '@/features/insights/utils/insightsFormat';
import { layoutGrid, radius, space, textStyles, typography, useThemeColors } from '@/theme';

export type InsightsMemberBarRow = Omit<InsightsMemberBar, 'roleTranslationKey'> & {
  roleLabel: string;
};

export type InsightsGroupContributionProps = {
  title: string;
  members: InsightsMemberBarRow[];
};

export function InsightsGroupContribution({
  title,
  members,
}: InsightsGroupContributionProps): ReactElement {
  const palette = useThemeColors();

  return (
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
      <Text
        style={[
          textStyles.overline,
          {
            color: palette.textMuted,
            letterSpacing: typography.letterSpacing.widest,
            marginBottom: space.gapMd,
          },
        ]}
      >
        {title}
      </Text>
      <View style={{ gap: space.gapLg }}>
        {members.map((m) => (
          <View key={m.id} style={{ gap: space.gapSm }}>
            <View style={styles.rowTop}>
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
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[textStyles.label, { color: palette.textPrimary }]} numberOfLines={1}>
                  {m.displayName}
                </Text>
                <Text
                  style={[
                    textStyles.captionSmall,
                    { color: palette.textMuted, fontFamily: typography.fontFamily.mono.regular },
                  ]}
                  numberOfLines={1}
                >
                  {m.roleLabel}
                </Text>
              </View>
              <Text
                style={[
                  textStyles.label,
                  {
                    color: palette.textPrimary,
                    fontFamily: typography.fontFamily.mono.medium,
                    fontVariant: ['tabular-nums'],
                  },
                ]}
              >
                {formatInsightsInr(m.amountMinor)}
              </Text>
            </View>
            <View
              style={[
                styles.track,
                { borderColor: palette.borderSubtle, backgroundColor: palette.surfaceBase },
              ]}
            >
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.round(m.barShare * 100)}%`,
                    backgroundColor: palette.accent,
                    opacity: m.displayName === 'You' ? 1 : 0.55,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.paddingLg,
    paddingVertical: space.paddingLg,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutGrid.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    height: 10,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
