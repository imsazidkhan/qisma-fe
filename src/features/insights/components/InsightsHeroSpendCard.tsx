import { BlurView } from 'expo-blur';
import type { ReactElement } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { InsightsAreaSpark } from '@/features/insights/components/InsightsAreaSpark';
import type { InsightsTrendPoint } from '@/features/insights/model/insightsDemoModel';
import { formatInsightsInr } from '@/features/insights/utils/insightsFormat';
import { BalanceDotMatrixTexture } from '@/features/groups/components/BalanceDotMatrixTexture';
import {
  layoutGrid,
  platformShadow,
  radius,
  space,
  textStyles,
  typography,
  useThemeColors,
  useThemeMode,
} from '@/theme';

export type InsightsHeroSpendCardProps = {
  totalMinor: number;
  trendUp: boolean;
  sparkSeries: InsightsTrendPoint[];
  chartWidth: number;
  currencyLine: string;
  deltaLine: string;
};

export function InsightsHeroSpendCard({
  totalMinor,
  trendUp: _trendUp,
  sparkSeries,
  chartWidth,
  currencyLine,
  deltaLine,
}: InsightsHeroSpendCardProps): ReactElement {
  const palette = useThemeColors();
  const mode = useThemeMode();
  const tint = mode === 'dark' ? 'dark' : 'light';
  const sparkH = 88;
  const fillId = 'insightsHeroAreaFill';

  return (
    <View
      style={[
        platformShadow('premiumCard'),
        {
          borderRadius: radius['3xl'],
          alignSelf: 'stretch',
        },
      ]}
    >
      <View
        style={[
          styles.shell,
          {
            borderColor: palette.borderSubtle,
            borderRadius: radius['3xl'],
            overflow: 'hidden',
          },
        ]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={32} tint={tint} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.surfaceElevated }]} />
        )}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: palette.glassStrong, opacity: mode === 'dark' ? 0.28 : 0.52 },
          ]}
        />
        <BalanceDotMatrixTexture
          dotColor={palette.textPrimary}
          dotOpacity={mode === 'dark' ? 0.06 : 0.09}
        />
        <View style={styles.inner}>
          <Text
            style={[
              textStyles.overline,
              {
                color: palette.textMuted,
                letterSpacing: typography.letterSpacing.widest,
                marginBottom: layoutGrid.sm,
              },
            ]}
          >
            {currencyLine}
          </Text>
          <Text
            style={[
              textStyles.numericLarge,
              {
                color: palette.textPrimary,
                fontSize: 34,
                lineHeight: 40,
                fontFamily: typography.fontFamily.mono.medium,
                fontVariant: ['tabular-nums'],
              },
            ]}
          >
            {formatInsightsInr(totalMinor)}
          </Text>
          <View style={styles.deltaRow}>
            <View
              style={[
                styles.trendDot,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.surfaceFloating,
                },
              ]}
            />
            <Text
              style={[
                textStyles.captionSmall,
                {
                  color: palette.textSecondary,
                  fontFamily: typography.fontFamily.mono.medium,
                  fontVariant: ['tabular-nums'],
                },
              ]}
            >
              {deltaLine}
            </Text>
          </View>

          <View style={{ marginTop: space.gapMd, marginHorizontal: -space.gapXs, opacity: 0.92 }}>
            {sparkSeries.length > 0 ? (
              <InsightsAreaSpark
                data={sparkSeries}
                width={chartWidth}
                height={sparkH}
                strokeColor={palette.textMuted}
                fillTop={palette.borderSubtle}
                fillBottom={palette.surfaceElevated}
                gridColor={palette.borderSubtle}
                fillGradientId={fillId}
              />
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 200,
    position: 'relative',
  },
  inner: {
    paddingHorizontal: space.paddingXl,
    paddingVertical: space.paddingXl,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapSm,
    marginTop: space.gapMd,
  },
  trendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
