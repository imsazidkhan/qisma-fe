import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { InsightsAreaSpark } from '@/features/insights/components/InsightsAreaSpark';
import type { InsightsTrendPoint } from '@/features/insights/model/insightsDemoModel';
import {
  duration,
  easing,
  platformShadow,
  radius,
  space,
  textStyles,
  typography,
  useThemeColors,
} from '@/theme';

export type InsightsTrendSectionProps = {
  title: string;
  subtitle: string;
  series: InsightsTrendPoint[];
};

export function InsightsTrendSection({
  title,
  subtitle,
  series,
}: InsightsTrendSectionProps): ReactElement {
  const palette = useThemeColors();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const chartW = width - space.screenPadding * 2 - space.paddingLg * 2;
  const chartH = 192;
  const fillId = 'insightsMainTrendFill';
  const first = series[0]?.xLabel ?? '';
  const last = series.length > 0 ? (series[series.length - 1]?.xLabel ?? '') : '';
  const intro = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    intro.value = 0;
    intro.value = withTiming(1, {
      duration: duration.moderate.ms,
      easing: easing.enter.rn,
    });
  }, [intro, reduceMotion, series]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: intro.value,
    transform: [{ translateY: (1 - intro.value) * 8 }],
  }));

  return (
    <View style={[platformShadow('xs'), { borderRadius: radius['3xl'], alignSelf: 'stretch' }]}>
      <Animated.View
        style={[
          styles.card,
          {
            borderColor: palette.borderSubtle,
            backgroundColor: palette.surfaceElevated,
            borderRadius: radius['3xl'],
          },
          fadeStyle,
        ]}
      >
        <Text
          style={[
            textStyles.h3,
            {
              color: palette.textPrimary,
              fontFamily: typography.fontFamily.sans.semiBold,
              marginBottom: space.gapXs,
            },
          ]}
        >
          {title}
        </Text>
        <Text style={[textStyles.caption, { color: palette.textMuted, marginBottom: space.gap }]}>
          {subtitle}
        </Text>
        {series.length > 0 ? (
          <InsightsAreaSpark
            data={series}
            width={chartW}
            height={chartH}
            strokeColor={palette.textSecondary}
            fillTop={palette.borderSubtle}
            fillBottom={palette.surfaceBase}
            gridColor={palette.borderSubtle}
            fillGradientId={fillId}
          />
        ) : null}
        {first !== '' && last !== '' ? (
          <View style={styles.axisRow}>
            <Text
              style={[
                textStyles.captionSmall,
                {
                  color: palette.textMuted,
                  fontFamily: typography.fontFamily.mono.regular,
                  fontVariant: ['tabular-nums'],
                },
              ]}
            >
              {first}
            </Text>
            <Text
              style={[
                textStyles.captionSmall,
                {
                  color: palette.textMuted,
                  fontFamily: typography.fontFamily.mono.regular,
                  fontVariant: ['tabular-nums'],
                },
              ]}
            >
              {last}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.paddingLg,
    paddingTop: space.paddingLg,
    paddingBottom: space.gapMd,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.gapSm,
    paddingHorizontal: 2,
  },
});
