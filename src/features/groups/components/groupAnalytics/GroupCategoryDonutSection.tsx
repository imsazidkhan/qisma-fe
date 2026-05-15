import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';

import type { CategoryDonutSlice } from '@/features/groups/utils/groupAnalyticsDerived';
import { formatGroupAnalyticsInr } from '@/features/groups/utils/groupAnalyticsDerived';
import {
  duration,
  easing,
  layoutGrid,
  platformShadow,
  radius,
  space,
  textStyles,
  typography,
  useThemeColors,
  useThemeMode,
} from '@/theme';

const RIGHT_COL_MIN_W = 108;
/** Thick monochrome ring — Wallet-style weight. */
const RING_FULL = { C: 68, R: 44, STROKE: 13, GAP_DEG: 0.55 } as const;
const RING_COMPACT = { C: 56, R: 36, STROKE: 11, GAP_DEG: 0.55 } as const;
const BAR_WIDTH_FLOOR_PCT = 3.5;
const PREVIEW_TOP_N = 5;
const DONUT_FRAME_PAD = 6;

function iconForSlug(slugKey: string): keyof typeof Ionicons.glyphMap {
  const s = slugKey.toLowerCase();
  if (s.includes('food') || s.includes('dining') || s.includes('grocery') || s.includes('chai')) {
    return 'restaurant-outline';
  }
  if (s.includes('travel') || s.includes('flight') || s.includes('hotel'))
    return 'airplane-outline';
  if (
    s.includes('transport') ||
    s.includes('uber') ||
    s.includes('fuel') ||
    s.includes('vehicle')
  ) {
    return 'car-outline';
  }
  if (s.includes('shop') || s.includes('retail') || s.includes('gift')) return 'bag-handle-outline';
  if (s.includes('entertain') || s.includes('game') || s.includes('movie')) {
    return 'game-controller-outline';
  }
  if (s.includes('bill') || s.includes('util') || s.includes('rent') || s.includes('housing')) {
    return 'home-outline';
  }
  if (s.includes('health') || s.includes('medical')) return 'medkit-outline';
  if (s.includes('finance') || s.includes('invest')) return 'trending-up-outline';
  return 'pricetag-outline';
}

function iconForSliceId(sliceId: string): keyof typeof Ionicons.glyphMap {
  if (sliceId === '__analytics_other__') return 'ellipsis-horizontal-outline';
  const slugPart = sliceId.split('-')[0] ?? sliceId;
  return iconForSlug(slugPart);
}

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

function shareToBarWidthPct(share: number, roundedPct: number): number {
  if (share <= 0) return 0;
  const linear = share * 100;
  if (roundedPct < 1 && linear > 0) return Math.min(100, BAR_WIDTH_FLOOR_PCT);
  if (roundedPct >= 1 && roundedPct < 4)
    return Math.min(100, Math.max(linear, BAR_WIDTH_FLOOR_PCT));
  return Math.min(100, linear);
}

function formatShareLabel(share: number, roundedPct: number): string {
  if (share <= 0) return '0%';
  if (roundedPct < 1 && share > 0) return '<1%';
  return `${roundedPct}%`;
}

function mergeSlicesForPreview(
  slices: CategoryDonutSlice[],
  otherLabel: string,
): CategoryDonutSlice[] {
  if (slices.length <= PREVIEW_TOP_N) return slices;
  const top = slices.slice(0, PREVIEW_TOP_N);
  const tail = slices.slice(PREVIEW_TOP_N);
  const otherAmount = tail.reduce((s, x) => s + x.amountMajor, 0);
  const otherShare = tail.reduce((s, x) => s + x.share, 0);
  if (otherAmount <= 0 || otherShare <= 0) return top;
  return [
    ...top,
    {
      id: '__analytics_other__',
      label: otherLabel,
      amountMajor: otherAmount,
      share: otherShare,
    },
  ];
}

type CategoryDonutRowProps = {
  slice: CategoryDonutSlice;
  segmentIdx: number;
  dominantId: string | null;
  focusedId: string | null;
  onToggle: (id: string) => void;
  palette: ReturnType<typeof useThemeColors>;
  showDividerTop: boolean;
};

function CategoryDonutRow({
  slice: s,
  segmentIdx,
  dominantId,
  focusedId,
  onToggle,
  palette,
  showDividerTop,
}: CategoryDonutRowProps): ReactElement {
  const isSelected = focusedId === s.id;
  const isDimmed = focusedId !== null && !isSelected;
  const isDom = dominantId !== null && s.id === dominantId;
  const icon = iconForSliceId(s.id);
  const tone = segmentTone(palette, segmentIdx);
  const pctRounded = Math.round(s.share * 100);
  const barTargetW = shareToBarWidthPct(s.share, pctRounded);
  const pctLabel = formatShareLabel(s.share, pctRounded);

  const sel = useSharedValue(isSelected ? 1 : 0);
  const barW = useSharedValue(barTargetW);

  useEffect(() => {
    sel.value = withTiming(isSelected ? 1 : 0, {
      duration: duration.fast.ms,
      easing: easing.standard.rn,
    });
  }, [isSelected, sel]);

  useEffect(() => {
    barW.value = withTiming(barTargetW, {
      duration: duration.moderate.ms,
      easing: easing.standard.rn,
    });
  }, [barTargetW, barW]);

  const rowSurface = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(
        sel.value,
        [0, 1],
        ['transparent', palette.surfaceFloating],
      ),
      transform: [
        {
          scale: interpolate(sel.value, [0, 1], [1, 1.008]),
        },
        {
          translateY: interpolate(sel.value, [0, 1], [0, -0.5]),
        },
      ],
      shadowOpacity: interpolate(sel.value, [0, 1], [0, Platform.OS === 'ios' ? 0.14 : 0]),
      shadowRadius: interpolate(sel.value, [0, 1], [0, 8]),
      shadowOffset: { width: 0, height: interpolate(sel.value, [0, 1], [0, 4]) },
      elevation: interpolate(sel.value, [0, 1], [0, Platform.OS === 'android' ? 3 : 0]),
    }),
    [palette.surfaceFloating],
  );

  const barFillStyle = useAnimatedStyle(() => {
    const w = barW.value;
    return { width: `${w}%` };
  });

  const barTone = isSelected ? palette.textPrimary : isDom ? palette.textSecondary : tone;

  return (
    <View style={{ alignSelf: 'stretch' }}>
      {showDividerTop ? (
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            marginLeft: 0,
            backgroundColor: palette.borderSubtle,
            opacity: 0.85,
          }}
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${s.label}, ${formatGroupAnalyticsInr(s.amountMajor)}, ${pctLabel}`}
        hitSlop={{ top: 2, bottom: 2, left: 4, right: 4 }}
        android_ripple={
          Platform.OS === 'android'
            ? { color: palette.overlay, foreground: true, borderless: false }
            : undefined
        }
        onPress={() => {
          void Haptics.selectionAsync();
          onToggle(s.id);
        }}
        style={({ pressed }) => ({
          opacity: isDimmed ? 0.52 : pressed ? 0.96 : 1,
        })}
      >
        <Animated.View
          style={[
            {
              borderRadius: radius.lg,
              borderWidth: isSelected ? StyleSheet.hairlineWidth : 0,
              borderColor: isSelected ? palette.borderSubtle : 'transparent',
              paddingVertical: space.gapSm,
              paddingHorizontal: space.gapSm,
              marginVertical: 2,
              shadowColor: palette.shadow,
            },
            rowSurface,
          ]}
        >
          <View style={styles.rowGrid}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconCell,
                  {
                    borderColor: isSelected ? palette.textPrimary : palette.borderSubtle,
                    backgroundColor: isSelected ? palette.textPrimary : palette.surfaceBase,
                  },
                ]}
              >
                <Ionicons
                  name={icon}
                  size={isSelected ? 18 : 16}
                  color={isSelected ? palette.background : palette.textMuted}
                />
              </View>
              <Text
                style={[
                  textStyles.labelSmall,
                  {
                    color: palette.textPrimary,
                    flex: 1,
                    minWidth: 0,
                    fontFamily: isSelected
                      ? typography.fontFamily.sans.semiBold
                      : typography.fontFamily.sans.medium,
                  },
                ]}
                numberOfLines={1}
              >
                {s.label}
              </Text>
            </View>
            <View style={[styles.rowRight, { minWidth: RIGHT_COL_MIN_W }]}>
              <Text
                style={[
                  textStyles.labelSmall,
                  {
                    color: palette.textPrimary,
                    fontFamily: isSelected
                      ? typography.fontFamily.mono.bold
                      : typography.fontFamily.mono.medium,
                    fontVariant: ['tabular-nums'],
                    textAlign: 'right',
                  },
                ]}
                numberOfLines={1}
              >
                {formatGroupAnalyticsInr(s.amountMajor)}
              </Text>
              <Text
                style={[
                  textStyles.captionSmall,
                  {
                    marginTop: 2,
                    color: isSelected ? palette.textPrimary : palette.textMuted,
                    fontFamily: typography.fontFamily.mono.medium,
                    fontVariant: ['tabular-nums'],
                    textAlign: 'right',
                  },
                ]}
              >
                {pctLabel}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.track,
              {
                marginTop: space.gapSm,
                borderColor: palette.borderSubtle,
                backgroundColor: palette.surfaceBase,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.trackFill,
                {
                  backgroundColor: barTone,
                  opacity: isSelected ? 1 : isDom ? 0.88 : 0.72,
                },
                barFillStyle,
              ]}
            />
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

export type GroupCategoryDonutSectionProps = {
  slices: CategoryDonutSlice[];
  dominantId: string | null;
  headline: string | null;
  compact?: boolean;
};

export function GroupCategoryDonutSection({
  slices,
  dominantId,
  headline,
  compact = false,
}: GroupCategoryDonutSectionProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const mode = useThemeMode();
  const tint = mode === 'dark' ? 'dark' : 'light';
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const ringSlices = useMemo(
    () => (compact ? mergeSlicesForPreview(slices, t('groups.analytics.categoryOther')) : slices),
    [compact, slices, t],
  );

  const { C, R, STROKE, GAP_DEG } = compact ? RING_COMPACT : RING_FULL;

  const totalMajor = useMemo(() => slices.reduce((sum, s) => sum + s.amountMajor, 0), [slices]);

  const toggleSlice = useCallback((id: string) => {
    setFocusedId((cur) => (cur === id ? null : id));
  }, []);

  const circumference = 2 * Math.PI * R;
  let rotation = -90;

  const donutSize = C * 2;
  const framed = donutSize + DONUT_FRAME_PAD * 2;

  const padMain = compact ? space.gapMd : space.paddingLg;

  return (
    <View
      style={[
        platformShadow('premiumCard'),
        { alignSelf: 'stretch', borderRadius: radius.inviteCard },
      ]}
    >
      <View
        style={{
          borderRadius: radius.inviteCard,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.borderSubtle,
        }}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={22} tint={tint} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.surfaceElevated }]} />
        )}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: palette.glass,
              opacity: mode === 'dark' ? 0.38 : 0.32,
            },
          ]}
        />
        <View style={{ paddingHorizontal: padMain, paddingTop: padMain, paddingBottom: padMain }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: compact ? space.gapMd : space.gap,
              marginBottom: space.gap,
            }}
          >
            <View
              style={{
                flex: 1,
                minWidth: 0,
                justifyContent: 'center',
                gap: layoutGrid.micro,
                paddingRight: space.gapSm,
              }}
            >
              <Text
                style={[
                  textStyles.overline,
                  {
                    color: palette.textMuted,
                    letterSpacing: typography.letterSpacing.wider,
                  },
                ]}
              >
                {t('groups.analytics.categoryTotalSpent')}
              </Text>
              <Text
                style={[
                  textStyles.numeric,
                  {
                    color: palette.textPrimary,
                    fontFamily: typography.fontFamily.mono.medium,
                    fontSize: compact ? typography.fontSize.xl : typography.fontSize['2xl'],
                    fontVariant: ['tabular-nums'],
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {formatGroupAnalyticsInr(totalMajor)}
              </Text>
              {headline ? (
                <Text
                  style={[textStyles.captionSmall, { color: palette.textSecondary }]}
                  numberOfLines={2}
                >
                  {headline}
                </Text>
              ) : null}
            </View>

            <View
              style={[
                platformShadow('sm'),
                {
                  width: framed,
                  height: framed,
                  borderRadius: framed / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: palette.surfaceBase,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: palette.borderSubtle,
                  flexShrink: 0,
                },
              ]}
              importantForAccessibility="no-hide-descendants"
            >
              <View
                style={{
                  width: donutSize,
                  height: donutSize,
                  borderRadius: donutSize / 2,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Svg width={donutSize} height={donutSize} accessibilityRole="image">
                  {ringSlices.map((s, idx) => {
                    const arcLen =
                      Math.max(0.02, s.share) * circumference - (GAP_DEG / 360) * circumference;
                    const dash = Math.max(2, arcLen);
                    const isFocused = focusedId === s.id;
                    const isDimmed = focusedId !== null && !isFocused;
                    const base = segmentTone(palette, idx);
                    const stroke = isFocused ? palette.textPrimary : base;
                    const strokeW = isFocused ? STROKE + 2 : STROKE;
                    const el = (
                      <G
                        key={s.id}
                        transform={`rotate(${rotation} ${C} ${C})`}
                        opacity={isDimmed ? 0.28 : 1}
                      >
                        <Circle
                          cx={C}
                          cy={C}
                          r={R}
                          stroke={stroke}
                          strokeWidth={strokeW}
                          fill="none"
                          strokeDasharray={`${dash} ${circumference}`}
                          strokeLinecap="round"
                        />
                      </G>
                    );
                    rotation += s.share * 360 + GAP_DEG;
                    return el;
                  })}
                </Svg>
              </View>
            </View>
          </View>

          <View style={{ alignSelf: 'stretch' }}>
            {ringSlices.map((s, idx) => (
              <CategoryDonutRow
                key={s.id}
                dominantId={dominantId}
                focusedId={focusedId}
                segmentIdx={idx}
                showDividerTop={idx > 0}
                onToggle={toggleSlice}
                palette={palette}
                slice={s}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.gapMd,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutGrid.sm,
    minWidth: 0,
  },
  rowRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  iconCell: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  track: {
    height: 5,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
