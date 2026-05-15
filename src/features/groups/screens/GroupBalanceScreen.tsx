import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';

import { ApiError } from '@/api';
import { BackHeaderButton, Button } from '@/components/ui';
import { hrefGroupActivity, hrefGroupAddExpense } from '@/constants/routes';
import {
  BalancesActivityNudgeCard,
  FloatingSettleDock,
} from '@/features/groups/components/balances/editorial';
import {
  OpenBalancesSectionHeader,
  OpenBalanceRow,
} from '@/features/groups/components/balances/openBalances';
import { GroupHubBalanceSummaryCard } from '@/features/groups/components/GroupHubBalanceSummaryCard';
import { groupBalanceScreenStyles as styles } from '@/features/groups/components/groupBalanceScreen.styles';
import { useGroupsList } from '@/features/groups/hooks/useGroupsList';
import { useGroupBalancesSnapshot } from '@/features/groups/hooks/useGroupBalancesSnapshot';
import type { GroupBalancesViewerEdge } from '@/features/groups/types/groupBalancesViewer.types';
import { formatMinorAsCurrencyCompact } from '@/features/groups/utils/formatMinorAsCurrency';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { space, textStyles, useThemeColors } from '@/theme';

export type GroupBalanceScreenProps = {
  groupId: string;
  onBack: () => void;
};

const LIST_EXTRA_BOTTOM_PAD = 104;

function sortBalances(edges: GroupBalancesViewerEdge[]): GroupBalancesViewerEdge[] {
  return [...edges].sort((a, b) => {
    const rank = (e: GroupBalancesViewerEdge): number => (e.type === 'owed' ? 1 : 0);
    const primary = rank(b) - rank(a);
    if (primary !== 0) {
      return primary;
    }
    const label = (e: GroupBalancesViewerEdge): string =>
      (e.user.username?.trim() || e.user.name?.trim() || '').toLowerCase();
    return label(a).localeCompare(label(b));
  });
}

/** Collapses duplicate edges from the same counterparty + direction (server quirks). */
function dedupeViewerEdges(edges: GroupBalancesViewerEdge[]): GroupBalancesViewerEdge[] {
  const map = new Map<string, GroupBalancesViewerEdge>();
  for (const e of edges) {
    const key = `${e.user.id}:${e.type}`;
    const prev = map.get(key);
    if (!prev || e.amount > prev.amount) {
      map.set(key, e);
    }
  }
  return [...map.values()];
}

export function GroupBalanceScreen({ groupId, onBack }: GroupBalanceScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();
  const { isOnline, isReady } = useNetworkStatus();
  const { data: groups } = useGroupsList();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const { data, isPending, isError, error, refetch, isFetching } = useGroupBalancesSnapshot(
    groupId,
    { enabled: true },
  );

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const groupSubtitle = useMemo(() => {
    const row = groups?.find((g) => g.id === groupId);
    const name = row?.name?.trim();
    return name && name.length > 0 ? name : undefined;
  }, [groupId, groups]);

  const blocking = useMemo(() => {
    if (!isError || !(error instanceof ApiError)) {
      return null;
    }
    if (error.code === 'NOT_GROUP_MEMBER') {
      return 'not_member' as const;
    }
    if (
      error.code === 'GROUP_NOT_FOUND' ||
      error.code === 'USER_NOT_FOUND' ||
      error.status === 404
    ) {
      return 'not_found' as const;
    }
    return null;
  }, [error, isError]);

  const sortedRows = useMemo(
    () => sortBalances(dedupeViewerEdges(data?.balances ?? [])),
    [data?.balances],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const onDockFilter = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    Alert.alert(
      t('groups.detail.balanceDockFilterTitle'),
      t('groups.detail.balanceDockFilterBody'),
    );
  }, [t]);

  const onRowSettle = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    Alert.alert(t('groups.detail.settleSoonTitle'), t('groups.detail.settleSoonBody'));
  }, [t]);

  const stickyVisible =
    Boolean(data) && sortedRows.length > 0 && data?.summary.status !== 'settled';

  const stickyA11y = useMemo(() => {
    if (!data) {
      return t('groups.detail.balanceStickySettleCta');
    }
    const amt = formatMinorAsCurrencyCompact(data.summary.netAmount, data.summary.currency);
    return t('groups.detail.balanceStickySettleA11y', { amount: amt });
  }, [data, t]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<GroupBalancesViewerEdge>) => (
      <OpenBalanceRow
        edge={item}
        currency={data?.summary.currency ?? 'INR'}
        expanded={expandedUserId === item.user.id}
        snapshotIso={data?.updatedAt ?? ''}
        showSeparator={index < sortedRows.length - 1}
        onToggleExpand={() =>
          setExpandedUserId((cur) => (cur === item.user.id ? null : item.user.id))
        }
        onSettle={onRowSettle}
        onViewActivity={() => router.push(hrefGroupActivity(groupId))}
        onAddExpense={() => router.push(hrefGroupAddExpense(groupId))}
      />
    ),
    [
      data?.summary.currency,
      data?.updatedAt,
      expandedUserId,
      groupId,
      onRowSettle,
      sortedRows.length,
    ],
  );

  const listHeader = useMemo(
    () => (
      <View>
        <View style={styles.headerShell}>
          <View style={styles.headerTopRow}>
            <BackHeaderButton
              onPress={onBack}
              accessibilityLabel={t('groups.detail.balanceScreenBackA11y')}
            />
            <View style={styles.headerTitles}>
              <Text
                style={[styles.title, { color: palette.textPrimary }]}
                accessibilityRole="header"
              >
                {t('groups.detail.balanceScreenHeadline')}
              </Text>
              {groupSubtitle ? (
                <Text
                  style={[styles.subtitle, { color: palette.textMuted }]}
                  numberOfLines={2}
                  accessibilityRole="text"
                  accessibilityLabel={groupSubtitle}
                >
                  {groupSubtitle}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {isReady && !isOnline ? (
          <View
            style={[
              styles.offlineBanner,
              { borderColor: palette.border, backgroundColor: palette.surfaceElevated },
            ]}
          >
            <Text style={[textStyles.captionSmall, { color: palette.textSecondary }]}>
              {t('groups.detail.balanceOfflineBanner')}
            </Text>
          </View>
        ) : null}

        {(() => {
          const settleCtaLabel = t('groups.detail.hubSettleUpCta');
          const settleCtaA11y = t('groups.detail.hubSettleUpCtaA11y');

          if (isPending && !data) {
            return (
              <View style={styles.hubCardWrap}>
                <GroupHubBalanceSummaryCard
                  variant="settled"
                  eyebrow={t('groups.detail.hubBalanceLoadingEyebrow')}
                  primaryText={t('groups.detail.hubBalanceLoadingPrimary')}
                  settleCtaLabel={settleCtaLabel}
                  settleCtaA11y={settleCtaA11y}
                />
              </View>
            );
          }

          if (isError && !data) {
            return (
              <View style={styles.hubCardWrap}>
                <GroupHubBalanceSummaryCard
                  variant="settled"
                  eyebrow={t('groups.detail.hubBalanceErrorEyebrow')}
                  primaryText={t('groups.detail.hubBalanceErrorPrimary')}
                  settleCtaLabel={settleCtaLabel}
                  settleCtaA11y={settleCtaA11y}
                />
              </View>
            );
          }

          if (!data) {
            return null;
          }

          const summary = data.summary;
          const currency = summary.currency;
          const netCompact = formatMinorAsCurrencyCompact(summary.netAmount, currency);
          const activeBalanceFootline = { count: sortedRows.length, status: summary.status };

          if (summary.status === 'settled') {
            return (
              <View style={styles.hubCardWrap}>
                <GroupHubBalanceSummaryCard
                  variant="settled"
                  eyebrow={t('groups.detail.hubBalanceHeroLabelSettled')}
                  primaryText={netCompact}
                  activeBalanceFootline={activeBalanceFootline}
                  settleCtaLabel={settleCtaLabel}
                  settleCtaA11y={settleCtaA11y}
                />
              </View>
            );
          }

          const tone = summary.status === 'you_owe' ? 'you_owe' : 'owed_to_you';
          const eyebrow =
            tone === 'owed_to_you'
              ? t('groups.detail.hubBalanceHeroLabelCredit')
              : t('groups.detail.hubBalanceHeroLabelDebit');

          return (
            <View style={styles.hubCardWrap}>
              <GroupHubBalanceSummaryCard
                variant="active"
                tone={tone}
                eyebrow={eyebrow}
                primaryText={netCompact}
                activeBalanceFootline={activeBalanceFootline}
                showSettleCta
                onSettlePress={onRowSettle}
                settleCtaLabel={settleCtaLabel}
                settleCtaA11y={settleCtaA11y}
              />
            </View>
          );
        })()}

        {data && sortedRows.length > 0 ? (
          <OpenBalancesSectionHeader
            titleNoCount={t('groups.detail.balanceOpenBalancesKicker')}
            titleWithCount={t('groups.detail.balanceOpenBalancesKickerWithCount', {
              count: sortedRows.length,
            })}
            count={sortedRows.length}
          />
        ) : null}

        {data ? (
          <>
            {sortedRows.length === 0 ? (
              <View style={styles.emptyShell}>
                <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
                  {t('groups.detail.balanceEmptyTitle')}
                </Text>
                <Text style={[styles.emptyBody, { color: palette.textSecondary }]}>
                  {t('groups.detail.balanceEmptyBody')}
                </Text>
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    ),
    [
      data,
      groupSubtitle,
      isError,
      isOnline,
      isPending,
      isReady,
      onBack,
      onRowSettle,
      palette.border,
      palette.surfaceElevated,
      palette.textMuted,
      palette.textPrimary,
      palette.textSecondary,
      sortedRows.length,
      t,
    ],
  );

  const dockAmountDisplay = useMemo(() => {
    if (!data) {
      return '';
    }
    return formatMinorAsCurrencyCompact(data.summary.netAmount, data.summary.currency);
  }, [data]);

  const listFooter = useMemo(
    () =>
      Boolean(data) && sortedRows.length > 0 ? (
        <BalancesActivityNudgeCard onPress={() => router.push(hrefGroupActivity(groupId))} />
      ) : null,
    [data, sortedRows.length, groupId],
  );

  if (blocking === 'not_member') {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
        <View style={[styles.centeredBody, { paddingTop: space.gapMd }]}>
          <View style={styles.headerTopRow}>
            <BackHeaderButton
              onPress={onBack}
              accessibilityLabel={t('groups.detail.balanceScreenBackA11y')}
            />
          </View>
          <Text style={[textStyles.h3, { color: palette.textPrimary }]} accessibilityRole="header">
            {t('groups.groupActivity.notMemberTitle')}
          </Text>
          <Text style={[textStyles.body, { color: palette.textSecondary }]}>
            {t('groups.groupActivity.notMemberBody')}
          </Text>
          <Button
            label={t('groups.membersScreen.notMemberCta')}
            variant="secondary"
            onPress={onBack}
            trailing="none"
            labelCase="none"
            accessibilityLabel={t('groups.membersScreen.notMemberCtaA11y')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (blocking === 'not_found') {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
        <View style={[styles.centeredBody, { paddingTop: space.gapMd }]}>
          <View style={styles.headerTopRow}>
            <BackHeaderButton
              onPress={onBack}
              accessibilityLabel={t('groups.detail.balanceScreenBackA11y')}
            />
          </View>
          <Text style={[textStyles.h3, { color: palette.textPrimary }]} accessibilityRole="header">
            {t('groups.detail.notFoundTitle')}
          </Text>
          <Text style={[textStyles.body, { color: palette.textSecondary }]}>
            {t('groups.detail.notFoundBody')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const bottomPad = insets.bottom + space.gapXl + (stickyVisible ? LIST_EXTRA_BOTTOM_PAD : 0);

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: palette.balancesCanvas }]}
    >
      <View style={[styles.flexFill, { backgroundColor: palette.balancesCanvas }]}>
        <FlashList
          data={sortedRows}
          renderItem={renderItem}
          keyExtractor={(item) => item.user.id}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          extraData={expandedUserId}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || (isFetching && !isPending)}
              onRefresh={() => void onRefresh()}
              tintColor={palette.accent}
            />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        <FloatingSettleDock
          visible={stickyVisible}
          canvasColor={palette.balancesCanvas}
          amountDisplay={dockAmountDisplay}
          onPress={onRowSettle}
          accessibilityLabel={stickyA11y}
          onFilterPress={onDockFilter}
        />
      </View>
    </SafeAreaView>
  );
}
