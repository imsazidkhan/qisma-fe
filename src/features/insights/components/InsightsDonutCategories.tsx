import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { BalanceDotMatrixTexture } from '@/features/groups/components/BalanceDotMatrixTexture';
import type { InsightsCategorySlice } from '@/features/insights/model/insightsDemoModel';
import {
  categoryIconForInsights,
  formatInsightsInr,
} from '@/features/insights/utils/insightsFormat';
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

export type InsightsDonutCategoriesProps = {
  slices: InsightsCategorySlice[];
  dominantId: string;
  headline: string;
  labelsById: Record<string, string>;
  totalSpentMinor: number;
  deltaLine: string;
  totalSpentLabel: string;
};

const C = 78;
const R = 56;
const STROKE = 15;
const GAP_DEG = 0.55;

function segmentTone(palette: ReturnType<typeof useThemeColors>, idx: number): string {
  const tones = [
    palette.textSecondary,
    palette.textMuted,
    palette.border,
    palette.borderSubtle,
    palette.iconMuted,
  ];
  return tones[idx % tones.length] ?? palette.borderSubtle;
}

export function InsightsDonutCategories({
  slices,
  dominantId,
  headline,
  labelsById,
  totalSpentMinor,
  deltaLine,
  totalSpentLabel,
}: InsightsDonutCategoriesProps): ReactElement {
  const palette = useThemeColors();
  const mode = useThemeMode();
  const tint = mode === 'dark' ? 'dark' : 'light';
  const sorted = [...slices].sort((a, b) => a.order - b.order);
  const circumference = 2 * Math.PI * R;
  let rotation = -90;
  const donutPx = C * 2;

  return (
    <View
      style={[platformShadow('premiumCard'), { borderRadius: radius['3xl'], alignSelf: 'stretch' }]}
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
          <BlurView intensity={26} tint={tint} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.surfaceElevated }]} />
        )}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: palette.glassStrong, opacity: mode === 'dark' ? 0.32 : 0.44 },
          ]}
        />
        <BalanceDotMatrixTexture
          dotColor={palette.textPrimary}
          dotOpacity={mode === 'dark' ? 0.055 : 0.08}
        />
        <View
          style={{
            paddingHorizontal: space.paddingLg,
            paddingTop: space.paddingLg,
            paddingBottom: space.gap,
          }}
        >
          <Text
            style={[
              textStyles.body,
              {
                color: palette.textSecondary,
                fontFamily: typography.fontFamily.sans.medium,
                marginBottom: space.gapMd,
              },
            ]}
            numberOfLines={2}
          >
            {headline}
          </Text>

          <View style={{ alignItems: 'center', marginBottom: space.gap }}>
            <View style={{ width: donutPx, height: donutPx, position: 'relative' }}>
              <Svg width={donutPx} height={donutPx}>
                {sorted.map((s, idx) => {
                  const arcLen =
                    Math.max(0.04, s.share) * circumference - (GAP_DEG / 360) * circumference;
                  const dash = Math.max(2, arcLen);
                  const base = segmentTone(palette, idx);
                  const stroke = s.id === dominantId ? palette.textPrimary : base;
                  const el = (
                    <G key={s.id} transform={`rotate(${rotation} ${C} ${C})`}>
                      <Circle
                        cx={C}
                        cy={C}
                        r={R}
                        stroke={stroke}
                        strokeWidth={STROKE}
                        fill="none"
                        strokeDasharray={`${dash} ${circumference}`}
                        strokeLinecap="butt"
                      />
                    </G>
                  );
                  rotation += s.share * 360 + GAP_DEG;
                  return el;
                })}
              </Svg>
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  { alignItems: 'center', justifyContent: 'center' },
                ]}
              >
                <Text
                  style={[
                    textStyles.overline,
                    {
                      color: palette.textMuted,
                      letterSpacing: typography.letterSpacing.wider,
                      marginBottom: layoutGrid.micro,
                    },
                  ]}
                >
                  {totalSpentLabel}
                </Text>
                <Text
                  style={[
                    textStyles.numeric,
                    {
                      color: palette.textPrimary,
                      fontFamily: typography.fontFamily.mono.medium,
                      fontSize: typography.fontSize.xl,
                      fontVariant: ['tabular-nums'],
                    },
                  ]}
                  numberOfLines={1}
                >
                  {formatInsightsInr(totalSpentMinor)}
                </Text>
                <Text
                  style={[
                    textStyles.captionSmall,
                    {
                      color: palette.textMuted,
                      fontFamily: typography.fontFamily.mono.medium,
                      marginTop: layoutGrid.micro,
                      fontVariant: ['tabular-nums'],
                    },
                  ]}
                >
                  {deltaLine}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ gap: space.gapSm }}>
            {sorted.map((s, idx) => {
              const icon = categoryIconForInsights(s.id);
              const tone = segmentTone(palette, idx);
              const pct = Math.round(s.share * 100);
              const isDom = s.id === dominantId;

              return (
                <View
                  key={s.id}
                  style={[
                    styles.rowCard,
                    {
                      borderColor: palette.borderSubtle,
                      backgroundColor: palette.surfaceFloating,
                      borderRadius: radius['2xl'],
                    },
                  ]}
                >
                  <View style={styles.rowTop}>
                    <View
                      style={[
                        styles.iconCell,
                        {
                          borderColor: palette.borderSubtle,
                          backgroundColor: palette.surfaceBase,
                        },
                      ]}
                    >
                      <Ionicons
                        name={icon}
                        size={17}
                        color={isDom ? palette.textPrimary : palette.textMuted}
                      />
                    </View>
                    <View style={styles.rowMid}>
                      <Text
                        style={[textStyles.labelSmall, { color: palette.textPrimary }]}
                        numberOfLines={1}
                      >
                        {labelsById[s.id] ?? s.id}
                      </Text>
                    </View>
                    <View style={styles.rowEnd}>
                      <Text
                        style={[
                          textStyles.labelSmall,
                          {
                            color: palette.textPrimary,
                            fontFamily: typography.fontFamily.mono.medium,
                            fontVariant: ['tabular-nums'],
                          },
                        ]}
                      >
                        {formatInsightsInr(s.amountMinor)}
                      </Text>
                      <View style={styles.endMeta}>
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
                          {pct}%
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={palette.iconMuted} />
                      </View>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.track,
                      { borderColor: palette.borderSubtle, backgroundColor: palette.surfaceBase },
                    ]}
                  >
                    <View
                      style={[
                        styles.trackFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: isDom ? palette.textPrimary : tone,
                          opacity: isDom ? 0.9 : 0.65,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  rowCard: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.gapMd,
    paddingTop: space.gapMd,
    paddingBottom: space.gapSm,
    gap: space.gapSm,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutGrid.sm,
  },
  iconCell: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMid: {
    flex: 1,
    minWidth: 0,
  },
  rowEnd: {
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
  },
  endMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  track: {
    height: 2,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 2,
  },
});
