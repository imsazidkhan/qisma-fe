import { Button } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { hrefGroupDetail, ROUTES } from '@/constants/routes';
import type { GroupListItem } from '@/features/groups/types/groupsList.types';
import { formatMinorAsCurrency } from '@/features/groups/utils/formatMinorAsCurrency';
import { HomeDashboardGroupRow } from '@/features/home/components/HomeDashboardGroupRow';
import { homeDashboardScreenStyles as styles } from '@/features/home/components/homeDashboardScreen.styles';
import { useHomeDashboardHeaderStamp } from '@/features/home/hooks/useHomeDashboardHeaderStamp';
import { aggregateGroupBalances } from '@/features/home/utils/aggregateGroupBalances';
import { useGroupInvitesInbox } from '@/features/invites/hooks/useGroupInvitesInbox';
import { space, textStyles, typography, useThemeColors } from '@/theme';

export type HomeDashboardScreenProps = {
  displayName: string | null;
  groups: GroupListItem[];
  isGroupsError: boolean;
  onRetryGroups: () => void;
  /** Same query as `groups` — refetch for pull-to-refresh (TanStack dedupes observers). */
  refetchGroupsList: () => Promise<unknown>;
  onExpensePress: () => void;
  scrollBottomPadding: number;
};

function balanceLineForItem(
  item: GroupListItem,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const { tone, amountMinor, currency } = item.balance;
  if (tone === 'settled') {
    return t('groups.balance.settled');
  }
  const amt = formatMinorAsCurrency(amountMinor, currency);
  if (tone === 'owed_to_you') {
    return t('groups.balance.owedToYou', { amount: amt });
  }
  return t('groups.balance.youOwe', { amount: amt });
}

function balanceColorForTone(
  tone: GroupListItem['balance']['tone'],
  palette: ReturnType<typeof useThemeColors>,
): string {
  switch (tone) {
    case 'owed_to_you':
      return palette.successText;
    case 'you_owe':
      return palette.errorText;
    default:
      return palette.textMuted;
  }
}

export function HomeDashboardScreen({
  displayName,
  groups,
  isGroupsError,
  onRetryGroups,
  refetchGroupsList,
  onExpensePress,
  scrollBottomPadding,
}: HomeDashboardScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const headerStamp = useHomeDashboardHeaderStamp();
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const { data: inviteInbox, refetch: refetchInvitesInbox } = useGroupInvitesInbox();
  const inviteBadgeCount = inviteInbox?.length ?? 0;

  const totals = useMemo(() => aggregateGroupBalances(groups), [groups]);

  const balancePresentation = useMemo(() => {
    if (isGroupsError && groups.length === 0) {
      return { kind: 'loadFailed' as const };
    }
    if (totals.hasMixedCurrency) {
      return { kind: 'mixedCurrency' as const };
    }

    const { netMinor, currency } = totals;
    const formatted = formatMinorAsCurrency(Math.abs(netMinor), currency);
    let netDisplay = formatted;
    if (netMinor > 0) {
      netDisplay = `+${formatted}`;
    } else if (netMinor < 0) {
      netDisplay = `−${formatted}`;
    }

    const owedLine = t('homeDashboard.youAreOwedLine', {
      amount: formatMinorAsCurrency(totals.totalOwedMinor, totals.currency),
    });
    const oweLine = t('homeDashboard.youOweLine', {
      amount: formatMinorAsCurrency(totals.totalOweMinor, totals.currency),
    });

    return {
      kind: 'normal' as const,
      netDisplay,
      owedLine,
      oweLine,
    };
  }, [groups.length, isGroupsError, t, totals]);

  const greeting = useMemo(() => {
    if (displayName?.trim()) {
      return t('homeDashboard.greeting', { name: displayName.trim() });
    }
    return t('homeDashboard.greetingFallback');
  }, [displayName, t]);

  const homeGroups = useMemo(() => groups.slice(0, 8), [groups]);

  const handleRefreshFromPull = useCallback(async () => {
    setPullRefreshing(true);
    try {
      await Promise.all([refetchGroupsList(), refetchInvitesInbox()]);
    } finally {
      setPullRefreshing(false);
    }
  }, [refetchGroupsList, refetchInvitesInbox]);

  const handleOpenGroupsTab = useCallback(() => {
    router.push(ROUTES.HOME_GROUPS);
  }, []);

  const handleOpenGroupDetail = useCallback((groupId: string) => {
    router.push(hrefGroupDetail(groupId));
  }, []);

  const inboxAccessibilityLabel = useMemo(() => {
    if (inviteBadgeCount <= 0) {
      return t('homeDashboard.inboxA11y');
    }
    return `${t('homeDashboard.inboxA11y')}, ${t('homeDashboard.inboxBadge', { count: inviteBadgeCount })}`;
  }, [inviteBadgeCount, t]);

  const handleOpenInbox = useCallback(() => {
    router.push(ROUTES.HOME_INVITES);
  }, []);

  const handleNewGroupPress = useCallback(() => {
    router.push(ROUTES.HOME_CREATE_GROUP);
  }, []);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={() => void handleRefreshFromPull()}
            tintColor={palette.accent}
            colors={[palette.accent]}
          />
        }
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: space.screenPadding,
            paddingBottom: scrollBottomPadding,
          },
        ]}
      >
        <View style={styles.topBarRow}>
          <View
            style={styles.topBarMeta}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text style={[styles.topBarMetaText, { color: palette.textMuted }]} numberOfLines={1}>
              {headerStamp}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={inboxAccessibilityLabel}
            accessibilityHint={t('homeDashboard.inboxHint')}
            onPress={handleOpenInbox}
            hitSlop={8}
            style={({ pressed }) => [styles.inboxHit, { opacity: pressed ? 0.72 : 1 }]}
          >
            <View style={styles.inboxIconWrap}>
              <Ionicons name="mail-outline" size={26} color={palette.textPrimary} />
              {inviteBadgeCount > 0 ? (
                <View style={[styles.inboxBadge, { backgroundColor: palette.accent }]}>
                  <Text
                    style={[
                      textStyles.labelSmall,
                      {
                        fontFamily: typography.fontFamily.mono.regular,
                        color: palette.textOnAccent,
                        fontVariant: ['tabular-nums'],
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {inviteBadgeCount > 999 ? '999+' : String(inviteBadgeCount)}
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        </View>
        <Text style={[styles.greeting, { color: palette.textPrimary }]} accessibilityRole="header">
          {greeting}
        </Text>

        {isGroupsError ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('homeDashboard.groupsErrorRetryA11y')}
            onPress={onRetryGroups}
            style={[
              styles.errorBanner,
              { borderColor: palette.borderSubtle, backgroundColor: palette.surfaceElevated },
            ]}
          >
            <Text style={{ ...styles.balanceMetaLine, color: palette.textSecondary, flex: 1 }}>
              {t('homeDashboard.groupsLoadError')}
            </Text>
            <Text style={{ ...styles.groupName, color: palette.accent }}>{t('groups.retry')}</Text>
          </Pressable>
        ) : null}

        <View
          style={[
            styles.balanceCard,
            { borderColor: palette.borderSubtle, backgroundColor: palette.surfaceElevated },
          ]}
        >
          <Text style={[styles.balanceEyebrow, { color: palette.textMuted }]}>
            {t('homeDashboard.totalBalance')}
          </Text>
          {balancePresentation.kind === 'normal' ? (
            <>
              <Text
                style={[styles.balanceNet, { color: palette.textPrimary }]}
                accessibilityRole="text"
              >
                {balancePresentation.netDisplay}
              </Text>
              <View style={styles.balanceMetaRow}>
                <Text style={[styles.balanceMetaLine, { color: palette.textSecondary }]}>
                  {balancePresentation.owedLine}
                </Text>
                <Text style={[styles.balanceMetaLine, { color: palette.textSecondary }]}>
                  {balancePresentation.oweLine}
                </Text>
              </View>
            </>
          ) : balancePresentation.kind === 'loadFailed' ? (
            <>
              <Text
                style={[styles.balanceNet, { color: palette.textSecondary }]}
                accessibilityRole="text"
              >
                {t('homeDashboard.balanceUnavailable')}
              </Text>
              <Text
                style={[styles.balanceMetaLine, { color: palette.textMuted, textAlign: 'center' }]}
              >
                {t('homeDashboard.balanceUnavailableHint')}
              </Text>
            </>
          ) : (
            <>
              <Text
                style={[styles.balanceNet, { color: palette.textSecondary }]}
                accessibilityRole="text"
              >
                {t('homeDashboard.mixedCurrencyTotals')}
              </Text>
              <Text
                style={[styles.balanceMetaLine, { color: palette.textMuted, textAlign: 'center' }]}
              >
                {t('homeDashboard.mixedCurrencyHint')}
              </Text>
            </>
          )}
        </View>

        <View>
          <Text style={[styles.sectionEyebrow, { color: palette.textMuted }]}>
            {t('homeDashboard.quickActions')}
          </Text>
          <View style={styles.quickActionsRow}>
            <View style={styles.quickActionBtn}>
              <Button
                label={t('homeDashboard.expenseCta')}
                onPress={onExpensePress}
                variant="secondary"
                trailing="none"
                labelCase="none"
                contentAlign="center"
                accessibilityLabel={t('homeDashboard.expenseA11y')}
                accessibilityHint={t('homeDashboard.expenseHint')}
              />
            </View>
            <View style={styles.quickActionBtn}>
              <Button
                label={t('homeDashboard.groupCta')}
                onPress={handleNewGroupPress}
                variant="secondary"
                trailing="none"
                labelCase="none"
                contentAlign="center"
                accessibilityLabel={t('homeDashboard.groupA11y')}
                accessibilityHint={t('home.startGroupHint')}
              />
            </View>
          </View>
        </View>

        <View>
          <Text style={[styles.sectionEyebrow, { color: palette.textMuted }]}>
            {t('homeDashboard.groupsSection')}
          </Text>
          {homeGroups.length === 0 ? (
            <Text style={[styles.emptyGroupsHint, { color: palette.textSecondary }]}>
              {t('homeDashboard.emptyGroups')}
            </Text>
          ) : (
            <View style={styles.groupList}>
              {homeGroups.map((g) => (
                <HomeDashboardGroupRow
                  key={g.id}
                  group={g}
                  balanceLine={balanceLineForItem(g, t)}
                  balanceColor={balanceColorForTone(g.balance.tone, palette)}
                  accessibilityHint={t('homeDashboard.groupRowHint')}
                  onPress={handleOpenGroupDetail}
                />
              ))}
            </View>
          )}
          {groups.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('homeDashboard.seeAllGroupsA11y')}
              onPress={handleOpenGroupsTab}
            >
              <Text style={[styles.seeAll, { color: palette.accentMuted }]}>
                {t('homeDashboard.seeAllGroups')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
