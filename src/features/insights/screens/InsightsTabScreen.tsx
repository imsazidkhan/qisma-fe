import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { HomeDashboardHeader } from '@/features/home/components/HomeDashboardHeader';
import { useHomeDashboardHeaderController } from '@/features/home/hooks/useHomeDashboardHeaderController';
import { InsightsDonutCategories } from '@/features/insights/components/InsightsDonutCategories';
import { InsightsGroupInsightCards } from '@/features/insights/components/InsightsGroupInsightCards';
import { InsightsHeroSpendCard } from '@/features/insights/components/InsightsHeroSpendCard';
import { InsightsSmartStack } from '@/features/insights/components/InsightsSmartStack';
import { InsightsTrendSection } from '@/features/insights/components/InsightsTrendSection';
import { InsightsWrappedCta } from '@/features/insights/components/InsightsWrappedCta';
import {
  INSIGHTS_DEMO_BY_FILTER,
  type InsightsTimeFilterId,
} from '@/features/insights/model/insightsDemoModel';
import { getQismaTabBarContentInset } from '@/features/qisma/constants/tabBarLayout';
import { layoutGrid, radius, space, textStyles, typography, useThemeColors } from '@/theme';

const FILTERS: { id: InsightsTimeFilterId; labelKey: string }[] = [
  { id: 'this_month', labelKey: 'insights.filterThisMonth' },
  { id: 'last_month', labelKey: 'insights.filterLastMonth' },
  { id: 'three_months', labelKey: 'insights.filterThreeMonths' },
];

export function InsightsTabScreen(): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<InsightsTimeFilterId>('this_month');
  const { headerProps } = useHomeDashboardHeaderController();

  const data = INSIGHTS_DEMO_BY_FILTER[filter];
  const bottomPad = getQismaTabBarContentInset(insets.bottom);
  const heroChartW = width - space.screenPaddingLg * 2 - space.paddingXl * 2;

  const labelsById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of data.categories) {
      m[c.id] = t(c.translationKey);
    }
    return m;
  }, [data.categories, t]);

  const dominantCategoryLabel = labelsById[data.dominantCategoryId] ?? '';
  const dominantHeadline = t('insights.dominant', { category: dominantCategoryLabel });

  const deltaLine = data.trendUp
    ? t('insights.deltaUp', { pct: String(data.deltaVsPriorPct) })
    : t('insights.deltaDown', { pct: String(Math.abs(data.deltaVsPriorPct)) });

  const groupRows = data.groupBars.map((m) => ({
    ...m,
    roleLabel: t(m.roleTranslationKey),
  }));

  const smartLines = data.smartLines.map((s) => ({
    id: s.id,
    body: t(s.translationKey, { ...(s.translationParams ?? {}) }),
  }));

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
      <View style={[styles.insightsHeaderChrome, { borderBottomColor: palette.borderSubtle }]}>
        <HomeDashboardHeader {...headerProps} />
        <View style={styles.insightsHeadingBlock}>
          <Text style={[displayTitle, { color: palette.textPrimary }]}>{t('insights.title')}</Text>
          <Text style={[textStyles.caption, { color: palette.textSecondary }]}>
            {t('insights.subtitle')}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {FILTERS.map((f) => {
            const selected = f.id === filter;
            return (
              <Pressable
                key={f.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => {});
                  setFilter(f.id);
                }}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    borderColor: selected ? palette.border : palette.borderSubtle,
                    backgroundColor: selected ? palette.surfaceElevated : palette.surfaceFloating,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    textStyles.captionSmall,
                    {
                      color: selected ? palette.textPrimary : palette.textSecondary,
                      fontFamily: typography.fontFamily.mono.medium,
                      letterSpacing: typography.letterSpacing.wide,
                    },
                  ]}
                >
                  {t(f.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.body,
          {
            paddingHorizontal: space.screenPaddingLg,
            paddingBottom: bottomPad + space.sectionGap,
          },
        ]}
      >
        <InsightsHeroSpendCard
          totalMinor={data.totalSpentMinor}
          trendUp={data.trendUp}
          sparkSeries={data.trend}
          chartWidth={heroChartW}
          currencyLine={t('insights.heroEyebrow')}
          deltaLine={deltaLine}
        />

        <View style={{ height: space.sectionGapSm }} />

        <InsightsTrendSection
          title={t('insights.trendTitle')}
          subtitle={t('insights.trendSubtitle')}
          series={data.trend}
        />

        <View style={{ height: space.sectionGapSm }} />

        <View style={{ gap: space.gapXs, alignSelf: 'stretch' }}>
          <Text
            style={[
              textStyles.overline,
              {
                color: palette.textMuted,
                letterSpacing: typography.letterSpacing.widest,
              },
            ]}
          >
            {t('insights.categoryTitle')}
          </Text>
          <InsightsDonutCategories
            dominantId={data.dominantCategoryId}
            headline={dominantHeadline}
            labelsById={labelsById}
            slices={data.categories}
            totalSpentMinor={data.totalSpentMinor}
            deltaLine={deltaLine}
            totalSpentLabel={t('insights.categoryTotalLabel')}
          />
        </View>

        <View style={{ height: space.sectionGapSm }} />

        <View style={{ gap: space.gapSm, alignSelf: 'stretch' }}>
          <Text
            style={[
              textStyles.overline,
              {
                color: palette.textMuted,
                letterSpacing: typography.letterSpacing.widest,
              },
            ]}
          >
            {t('insights.groupTitle')}
          </Text>
          <InsightsGroupInsightCards members={groupRows} />
        </View>

        <View style={{ height: space.sectionGapSm }} />

        <InsightsSmartStack title={t('insights.smartTitle')} lines={smartLines} />

        <View style={{ height: space.sectionGapSm }} />

        <InsightsWrappedCta
          title={t('insights.wrappedTitle')}
          subtitle={t('insights.wrappedSubtitle')}
          previewLine={t('insights.wrappedPreview')}
          onPress={() => {
            void Haptics.selectionAsync().catch(() => {});
            Alert.alert(t('insights.wrappedSoonTitle'), t('insights.wrappedSoonBody'));
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const displayTitle = {
  fontFamily: typography.fontFamily.sans.semiBold,
  fontSize: typography.fontSize['3xl'],
  lineHeight: typography.fontSize['3xl'] * typography.lineHeight.tight,
  letterSpacing: typography.letterSpacing.tighter,
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  insightsHeaderChrome: {
    paddingTop: space.paddingMd,
    paddingBottom: space.gapMd,
    paddingHorizontal: space.screenPaddingLg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  insightsHeadingBlock: {
    marginTop: space.gapSm,
    gap: layoutGrid.micro,
    alignSelf: 'stretch',
  },
  filterScroll: {
    marginTop: space.gapMd,
    alignSelf: 'stretch',
  },
  filterRow: {
    gap: space.gapXs,
    alignItems: 'center',
    paddingVertical: 2,
  },
  filterChip: {
    paddingVertical: space.gapXs + 2,
    paddingHorizontal: space.gapMd,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  body: {
    paddingTop: space.sectionGapSm,
    gap: 0,
  },
});
