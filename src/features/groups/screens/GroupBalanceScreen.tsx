import { useFocusEffect } from '@react-navigation/native';
import type { TFunction } from 'i18next';
import * as Haptics from 'expo-haptics';
import { memo, useCallback, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api';
import { BackHeaderButton, Button } from '@/components/ui';
import { GroupBalanceHeroCard } from '@/features/groups/components/GroupBalanceHeroCard';
import { groupBalanceScreenStyles as styles } from '@/features/groups/components/groupBalanceScreen.styles';
import { useGroupsList } from '@/features/groups/hooks/useGroupsList';
import { useGroupBalancesSnapshot } from '@/features/groups/hooks/useGroupBalancesSnapshot';
import type {
  GroupBalancesViewerEdge,
  GroupBalancesViewerSummaryStatus,
} from '@/features/groups/types/groupBalancesViewer.types';
import { formatMinorAsCurrencyCompact } from '@/features/groups/utils/formatMinorAsCurrency';
import { platformShadow, space, textStyles, useThemeColors } from '@/theme';

export type GroupBalanceScreenProps = {
  groupId: string;
  onBack: () => void;
};

function edgeDisplayName(edge: GroupBalancesViewerEdge): string {
  const u = edge.user.username?.trim();
  if (u) {
    return u;
  }
  const n = edge.user.name?.trim();
  return n.length > 0 ? n : '?';
}

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

function formatSignedEdgeAmount(edge: GroupBalancesViewerEdge, currency: string): string {
  const formatted = formatMinorAsCurrencyCompact(edge.amount, currency);
  const sign = edge.type === 'owed' ? '+' : '\u2212';
  return `${sign}${formatted}`;
}

type OpenRowProps = {
  edge: GroupBalancesViewerEdge;
  currency: string;
  onPress: () => void;
};

const OpenBalanceRow = memo(function OpenBalanceRowInner({
  edge,
  currency,
  onPress,
}: OpenRowProps): ReactElement {
  const palette = useThemeColors();
  const { t } = useTranslation();
  const name = edgeDisplayName(edge);
  const amountStr = formatSignedEdgeAmount(edge, currency);
  const positive = edge.type === 'owed';

  const accessibilityLabel = t('groups.detail.balanceScreenRowA11y', {
    name,
    amount: amountStr,
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.rowPressable,
        platformShadow('xs'),
        {
          opacity: pressed ? 0.88 : 1,
          borderColor: palette.borderSubtle,
          backgroundColor: palette.surfaceElevated,
        },
      ]}
    >
      <View style={styles.rowInner}>
        <Text style={[styles.rowName, { color: palette.textPrimary }]} numberOfLines={1}>
          {name}
        </Text>
        <Text
          style={[styles.rowAmount, { color: positive ? palette.successText : palette.errorText }]}
          numberOfLines={1}
        >
          {amountStr}
        </Text>
      </View>
    </Pressable>
  );
});

function heroEyebrow(status: GroupBalancesViewerSummaryStatus, t: TFunction): string {
  switch (status) {
    case 'settled':
      return t('groups.detail.hubBalanceHeroLabelSettled');
    case 'owed_to_you':
      return t('groups.detail.hubBalanceHeroLabelCredit');
    default:
      return t('groups.detail.hubBalanceHeroLabelDebit');
  }
}

export function GroupBalanceScreen({ groupId, onBack }: GroupBalanceScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();
  const { data: groups } = useGroupsList();
  const [refreshing, setRefreshing] = useState(false);

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

  const sortedRows = useMemo(() => sortBalances(data?.balances ?? []), [data?.balances]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const onRowPress = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    Alert.alert(t('groups.detail.settleSoonTitle'), t('groups.detail.settleSoonBody'));
  }, [t]);

  const keyExtractor = useCallback((item: GroupBalancesViewerEdge) => item.user.id, []);

  const renderItem = useCallback<ListRenderItem<GroupBalancesViewerEdge>>(
    ({ item }) => (
      <OpenBalanceRow edge={item} currency={data?.summary.currency ?? 'INR'} onPress={onRowPress} />
    ),
    [data?.summary.currency, onRowPress],
  );

  const renderSeparator = useCallback(
    () => <View style={[styles.rowSeparator, { backgroundColor: palette.borderSubtle }]} />,
    [palette.borderSubtle],
  );

  const heroBlock = useMemo(() => {
    if (!data) {
      return null;
    }
    const { summary } = data;
    const amountDisplay = formatMinorAsCurrencyCompact(summary.netAmount, summary.currency);
    const activeBalanceCount = sortedRows.length;
    const eyebrow = heroEyebrow(summary.status, t);
    const suffix = t('groups.detail.balanceHeroFootlineSuffix');
    const noneLabel = t('groups.detail.balanceHeroFootlineNone');
    const footA11y = activeBalanceCount === 0 ? noneLabel : `+${activeBalanceCount} ${suffix}`;
    const heroA11y = `${eyebrow}. ${amountDisplay}. ${footA11y}`;

    return (
      <GroupBalanceHeroCard
        eyebrow={eyebrow}
        status={summary.status}
        amountDisplay={amountDisplay}
        activeBalanceCount={activeBalanceCount}
        accessibilityLabel={heroA11y}
      />
    );
  }, [data, sortedRows.length, t]);

  const listHeader = useMemo(
    () => (
      <View>
        <View style={styles.topRow}>
          <BackHeaderButton
            onPress={onBack}
            accessibilityLabel={t('groups.detail.balanceScreenBackA11y')}
          />
        </View>
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: palette.textPrimary }]} accessibilityRole="header">
            {t('groups.detail.balanceScreenHeadline')}
          </Text>
          {groupSubtitle ? (
            <Text style={[styles.subtitle, { color: palette.textMuted }]} numberOfLines={2}>
              {groupSubtitle}
            </Text>
          ) : null}
        </View>

        {isError && !blocking ? (
          <View
            style={[
              styles.errorBanner,
              { borderColor: palette.border, backgroundColor: palette.surfaceElevated },
            ]}
          >
            <Text style={[textStyles.body, { color: palette.textPrimary }]}>
              {t('groups.detail.balanceScreenLoadError')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('groups.detail.balanceScreenRetryA11y')}
              onPress={() => void refetch()}
              style={({ pressed }) => [
                styles.retryBtn,
                { opacity: pressed ? 0.72 : 1, borderColor: palette.border },
              ]}
            >
              <Text style={[textStyles.label, { color: palette.borderFocus }]}>
                {t('groups.detail.balanceScreenRetry')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {isPending && !data ? (
          <ActivityIndicator color={palette.accent} style={styles.loader} />
        ) : null}

        {heroBlock}

        {data ? (
          <>
            <Text style={[styles.sectionKicker, { color: palette.textMuted }]}>
              {t('groups.detail.balanceScreenOpenBalances')}
            </Text>

            {sortedRows.length === 0 ? (
              <Text style={[styles.emptyHint, { color: palette.textSecondary }]}>
                {t('groups.detail.balanceScreenEmptyOpenBalances')}
              </Text>
            ) : null}
          </>
        ) : null}
      </View>
    ),
    [
      blocking,
      data,
      groupSubtitle,
      heroBlock,
      isError,
      isPending,
      onBack,
      palette.accent,
      palette.border,
      palette.borderFocus,
      palette.surfaceElevated,
      palette.textMuted,
      palette.textPrimary,
      palette.textSecondary,
      refetch,
      sortedRows.length,
      t,
    ],
  );

  if (blocking === 'not_member') {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
        <View style={[styles.centeredBody, { paddingTop: space.gapMd }]}>
          <View style={styles.topRow}>
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
          <View style={styles.topRow}>
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

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
      <FlatList
        data={sortedRows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={renderSeparator}
        ListHeaderComponent={listHeader}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + space.gapXl }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || (isFetching && !isPending)}
            onRefresh={() => void onRefresh()}
            tintColor={palette.accent}
          />
        }
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}
