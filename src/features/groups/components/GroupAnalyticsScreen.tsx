import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeaderButton, Button, Input } from '@/components/ui';
import { useGroupAnalyticsBundle } from '@/features/groups/hooks/useGroupAnalyticsBundle';
import type { GroupAnalyticsQuery } from '@/features/groups/types/groupAnalytics.types';
import { isUuid } from '@/features/groups/utils/isUuid';
import { radius, space, textStyles, typography, useThemeColors } from '@/theme';

export type GroupAnalyticsScreenProps = {
  groupId: string;
  onBack: () => void;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactElement | ReactElement[] | null;
}): ReactElement {
  const palette = useThemeColors();
  return (
    <View style={{ gap: space.gapSm, alignSelf: 'stretch' }}>
      <Text
        style={{
          fontFamily: typography.fontFamily.mono.medium,
          fontSize: typography.fontSize['2xs'],
          letterSpacing: typography.letterSpacing.widest,
          textTransform: 'uppercase',
          color: palette.textMuted,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: palette.borderSubtle,
          padding: space.gap,
          gap: space.gapSm,
          backgroundColor: palette.surfaceElevated,
        }}
      >
        {children}
      </View>
    </View>
  );
}

export function GroupAnalyticsScreen({ groupId, onBack }: GroupAnalyticsScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [scopedUserId, setScopedUserId] = useState('');

  const query: GroupAnalyticsQuery = useMemo(() => {
    const q: GroupAnalyticsQuery = {};
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateFrom.trim())) {
      q.dateFrom = dateFrom.trim();
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo.trim())) {
      q.dateTo = dateTo.trim();
    }
    const su = scopedUserId.trim();
    if (isUuid(su)) {
      q.scopedUserId = su;
    }
    return q;
  }, [dateFrom, dateTo, scopedUserId]);

  const enabled = isUuid(groupId);
  const bundle = useGroupAnalyticsBundle(enabled ? groupId : undefined, query, { enabled });

  const mono = useMemo(
    () => ({
      fontFamily: typography.fontFamily.mono.regular,
      fontSize: typography.fontSize.xs,
      color: palette.textSecondary,
    }),
    [palette.textSecondary],
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.screenPadding,
          paddingBottom: space.sectionGapLg,
          gap: space.gapLg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={bundle.isFetching}
            onRefresh={() => bundle.refetchAll()}
            tintColor={palette.accent}
            colors={[palette.accent]}
          />
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.gapMd }}>
          <BackHeaderButton onPress={onBack} accessibilityLabel={t('common.backA11y')} />
        </View>
        <Text style={[textStyles.h3, { color: palette.textPrimary }]} accessibilityRole="header">
          {t('groups.analytics.title')}
        </Text>
        <Text style={[textStyles.captionSmall, { color: palette.textSecondary }]}>
          {t('groups.analytics.subtitle')}
        </Text>

        <View style={{ gap: space.gapMd, alignSelf: 'stretch' }}>
          <Input
            label={t('groups.analytics.dateFrom')}
            value={dateFrom}
            onChangeText={setDateFrom}
            helperText="YYYY-MM-DD"
          />
          <Input
            label={t('groups.analytics.dateTo')}
            value={dateTo}
            onChangeText={setDateTo}
            helperText="YYYY-MM-DD"
          />
          <Input
            label={t('groups.analytics.scopedUser')}
            value={scopedUserId}
            onChangeText={setScopedUserId}
            helperText={t('groups.analytics.scopedUserPlaceholder')}
          />
          <Button
            label={t('groups.analytics.refresh')}
            variant="secondary"
            onPress={() => bundle.refetchAll()}
            trailing="none"
            labelCase="none"
            accessibilityLabel={t('groups.analytics.refreshA11y')}
          />
        </View>

        {bundle.isError ? (
          <Text style={[textStyles.body, { color: palette.errorText }]}>
            {t('groups.analytics.loadError')}
          </Text>
        ) : null}

        {bundle.isPending && !bundle.categoryBreakdown.length ? (
          <ActivityIndicator color={palette.accent} />
        ) : null}

        <Section title={t('groups.analytics.sectionCategories')}>
          {bundle.categoryBreakdown.length === 0 ? (
            <Text style={mono}>{t('groups.analytics.empty')}</Text>
          ) : (
            bundle.categoryBreakdown.map((row) => (
              <Text key={`${row.categorySlug}-${row.categoryId ?? 'x'}`} style={mono}>
                {row.categorySlug} · {row.totalAmount} · {row.expenseCount}
              </Text>
            ))
          )}
        </Section>

        <Section title={t('groups.analytics.sectionMonthly')}>
          {bundle.monthlyTrends.length === 0 ? (
            <Text style={mono}>{t('groups.analytics.empty')}</Text>
          ) : (
            bundle.monthlyTrends.map((row) => (
              <Text key={`${row.year}-${row.month}`} style={mono}>
                {row.year}-{String(row.month).padStart(2, '0')} · {row.totalAmount} ·{' '}
                {row.expenseCount}
              </Text>
            ))
          )}
        </Section>

        <Section title={t('groups.analytics.sectionSpenders')}>
          {bundle.topSpenders.length === 0 ? (
            <Text style={mono}>{t('groups.analytics.empty')}</Text>
          ) : (
            bundle.topSpenders.map((row) => (
              <Text key={row.userId} style={mono}>
                {row.userId.slice(0, 8)}… · {row.totalPaidAmount} · {row.expenseCount}
              </Text>
            ))
          )}
        </Section>

        <Section title={t('groups.analytics.sectionMerchants')}>
          {bundle.merchants.length === 0 ? (
            <Text style={mono}>{t('groups.analytics.empty')}</Text>
          ) : (
            bundle.merchants.map((row) => (
              <Text key={row.merchantId} style={mono}>
                {row.displayName} · {row.totalAmount} · {row.expenseCount}
              </Text>
            ))
          )}
        </Section>

        <Section title={t('groups.analytics.sectionHeatmap')}>
          {bundle.heatmap.length === 0 ? (
            <Text style={mono}>{t('groups.analytics.empty')}</Text>
          ) : (
            bundle.heatmap.slice(0, 24).map((row) => (
              <Text key={`${row.dayOfWeek}-${row.hour}`} style={mono}>
                DOW {row.dayOfWeek} · H{row.hour} · {row.totalAmount} · {row.expenseCount}
              </Text>
            ))
          )}
        </Section>

        <Section title={t('groups.analytics.sectionRecurring')}>
          {bundle.recurring ? (
            <Text style={mono}>
              {t('groups.analytics.recurringLine', {
                clusters: bundle.recurring.clusterCount,
                flagged: bundle.recurring.flaggedExpenseCount,
                avg: bundle.recurring.avgConfidence ?? '—',
              })}
            </Text>
          ) : (
            <Text style={mono}>{t('groups.analytics.empty')}</Text>
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
