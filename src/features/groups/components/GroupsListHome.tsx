import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  ListRenderItem,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

import { AmbientSearchField } from '@/components/ui';

import { GroupListCard } from '@/features/groups/components/GroupListCard';
import {
  GROUPS_HUB_PROFILE_GLYPH_SIZE,
  GroupsHubProfileIconButton,
  GroupsPremiumHeader,
} from '@/features/groups/components/GroupsPremiumHeader';
import { useHomeDashboardHeaderController } from '@/features/home/hooks/useHomeDashboardHeaderController';
import type { GroupListItem } from '@/features/groups/types/groupsList.types';
import type { GroupsHomeTabQuery } from '@/features/groups/types/groupHome.types';
import { formatGroupsHubInlineMeta } from '@/features/groups/utils/formatGroupsHubInlineMeta';
import { layoutGrid, spacing, space, typography } from '@/theme';
import { useThemeColors, useThemeMode } from '@/theme/ThemeProvider';

export type GroupsListHomeProps = {
  groups: GroupListItem[];
  homeTab: GroupsHomeTabQuery;
  onHomeTabChange: (tab: GroupsHomeTabQuery) => void;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  onRefresh: () => void;
  scrollBottomPadding: number;
  onGroupPress?: (groupId: string) => void;
};

function formatGroupsDateLine(language: string | undefined, d: Date): string {
  const locale = language?.replace('_', '-') ?? undefined;
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

function useGroupsScreenDateLine(): string {
  const { i18n } = useTranslation();
  const isFocused = useIsFocused();
  const [line, setLine] = useState(() => formatGroupsDateLine(i18n.language, new Date()));

  useEffect(() => {
    if (!isFocused) return;
    setLine(formatGroupsDateLine(i18n.language, new Date()));
  }, [isFocused, i18n.language]);

  return line;
}

const FILTER_UNDERLINE_PAD = 14;
const LIST_GAP = spacing['6'];

type HubChromeProps = {
  dateLine: string;
  profileAccessibilityLabel: string;
  profileAccessibilityHint?: string;
  onProfilePress: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  balanceFilter: GroupsHomeTabQuery;
  onBalanceFilterChange: (f: GroupsHomeTabQuery) => void;
  hubMetaLine: string | null;
  isError: boolean;
  onRetry: () => void;
};

const GroupsHubChrome = memo(function GroupsHubChrome({
  dateLine,
  profileAccessibilityLabel,
  profileAccessibilityHint,
  onProfilePress,
  query,
  onQueryChange,
  balanceFilter,
  onBalanceFilterChange,
  hubMetaLine,
  isError,
  onRetry,
}: HubChromeProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const mode = useThemeMode();

  const segments = useMemo(
    () =>
      [
        {
          id: 'all' as const,
          label: t('groups.filterChip.all'),
          a11y: t('groups.filterChip.allA11y'),
        },
        {
          id: 'owe' as const,
          label: t('groups.filterChip.owe'),
          a11y: t('groups.filterChip.oweA11y'),
        },
        {
          id: 'get_back' as const,
          label: t('groups.filterChip.getBack'),
          a11y: t('groups.filterChip.getBackA11y'),
        },
        {
          id: 'settled' as const,
          label: t('groups.filterChip.settled'),
          a11y: t('groups.filterChip.settledA11y'),
        },
      ] as const,
    [t],
  );

  const heroCaption = hubMetaLine ?? t('groups.subtitle');

  return (
    <View style={styles.hubChromeRoot}>
      <GroupsPremiumHeader dateLine={dateLine} />

      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text
            style={[
              styles.heroTitle,
              {
                color: palette.textPrimary,
                letterSpacing: typography.letterSpacing.tight,
                ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
              },
            ]}
          >
            {t('groups.title')}
          </Text>
          <Text
            style={[styles.heroCaption, { color: palette.textSecondary, marginTop: spacing['2'] }]}
            accessibilityRole="text"
            numberOfLines={3}
          >
            {heroCaption}
          </Text>
        </View>
        <View style={styles.titleProfileSlot}>
          <GroupsHubProfileIconButton
            onPress={onProfilePress}
            accessibilityLabel={profileAccessibilityLabel}
            accessibilityHint={profileAccessibilityHint}
          >
            <Ionicons
              name="person-outline"
              size={GROUPS_HUB_PROFILE_GLYPH_SIZE}
              color={palette.textSecondary}
            />
          </GroupsHubProfileIconButton>
        </View>
      </View>

      <View style={styles.searchSlot}>
        <AmbientSearchField
          value={query}
          onChangeText={onQueryChange}
          placeholder={t('groups.searchPlaceholder')}
          searchAccessibilityLabel={t('groups.searchA11y')}
          onFilterPress={() => Keyboard.dismiss()}
          filterAccessibilityLabel={t('groups.filterSearchA11y')}
        />
      </View>

      <View style={styles.filterRow}>
        {segments.map((seg) => {
          const selected = balanceFilter === seg.id;
          const mutedInk = mode === 'light' ? 'rgba(0,0,0,0.3)' : palette.textMuted;
          return (
            <Pressable
              key={seg.id}
              accessibilityRole="tab"
              accessibilityLabel={seg.a11y}
              accessibilityState={{ selected }}
              onPress={() => onBalanceFilterChange(seg.id)}
              style={styles.filterHit}
            >
              <Text
                style={[
                  styles.filterLabel,
                  {
                    color: selected ? palette.textPrimary : mutedInk,
                    opacity: selected ? 1 : 0.82,
                    fontFamily: selected
                      ? typography.fontFamily.sans.medium
                      : typography.fontFamily.sans.regular,
                    fontWeight: selected
                      ? typography.fontWeight.medium
                      : typography.fontWeight.regular,
                  },
                ]}
              >
                {seg.label}
              </Text>
              <View style={styles.filterUnderlineTrack}>
                <View
                  style={[
                    styles.filterUnderlineBar,
                    {
                      opacity: selected ? 0.42 : 0,
                      backgroundColor: selected ? palette.textPrimary : 'transparent',
                    },
                  ]}
                />
              </View>
            </Pressable>
          );
        })}
      </View>

      {isError ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('groups.errorRetryA11y')}
          onPress={() => void onRetry()}
          style={styles.errorInline}
        >
          <Text style={[styles.errorBody, { color: palette.textSecondary, flex: 1 }]}>
            {t('groups.loadError')}
          </Text>
          <Text style={[styles.errorRetry, { color: palette.accent }]}>{t('groups.retry')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

export function GroupsListHome({
  groups,
  homeTab,
  onHomeTabChange,
  isFetching,
  isError,
  onRetry,
  onRefresh,
  scrollBottomPadding,
  onGroupPress,
}: GroupsListHomeProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const dateLine = useGroupsScreenDateLine();
  const { headerProps } = useHomeDashboardHeaderController();
  const [query, setQuery] = useState('');
  const [pullRefreshing, setPullRefreshing] = useState(false);

  useEffect(() => {
    if (!isFetching && pullRefreshing) {
      setPullRefreshing(false);
    }
  }, [isFetching, pullRefreshing]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, query]);

  const hubMetaLine = useMemo(() => formatGroupsHubInlineMeta(filtered, t), [filtered, t]);

  const renderItem: ListRenderItem<GroupListItem> = useCallback(
    ({ item }) => (
      <GroupListCard item={item} onPress={onGroupPress ? () => onGroupPress(item.id) : undefined} />
    ),
    [onGroupPress],
  );

  const itemSeparator = useCallback(() => <View style={{ height: LIST_GAP }} />, []);

  const keyExtractor = useCallback((item: GroupListItem) => item.id, []);

  const handlePullRefresh = useCallback(() => {
    setPullRefreshing(true);
    onRefresh();
  }, [onRefresh]);

  const listHeader = useMemo(
    () => (
      <GroupsHubChrome
        dateLine={dateLine}
        profileAccessibilityLabel={headerProps.profileAccessibilityLabel}
        profileAccessibilityHint={headerProps.profileAccessibilityHint}
        onProfilePress={headerProps.onProfilePress}
        query={query}
        onQueryChange={setQuery}
        balanceFilter={homeTab}
        onBalanceFilterChange={onHomeTabChange}
        hubMetaLine={hubMetaLine}
        isError={isError}
        onRetry={onRetry}
      />
    ),
    [homeTab, dateLine, headerProps, hubMetaLine, isError, onRetry, query, onHomeTabChange],
  );

  const emptyComponent = useMemo(() => {
    if (filtered.length > 0) {
      return undefined;
    }
    const q = query.trim();
    if (q.length > 0) {
      return (
        <Text
          style={[
            styles.emptyBody,
            { color: palette.textMuted, textAlign: 'center', paddingTop: space.gapLg },
          ]}
        >
          {t('groups.searchEmpty')}
        </Text>
      );
    }
    if (groups.length === 0) {
      if (homeTab === 'all') {
        return (
          <View style={{ paddingTop: space.gapLg, gap: space.gapMd }}>
            <Text
              style={[styles.emptyTitle, { color: palette.textPrimary }]}
              accessibilityRole="header"
            >
              {t('groups.hubEmptyTitle')}
            </Text>
            <Text style={[styles.emptyBody, { color: palette.textSecondary }]}>
              {t('groups.hubEmptyBody')}
            </Text>
          </View>
        );
      }
      if (homeTab === 'owe') {
        return (
          <View style={{ paddingTop: space.gapLg, gap: space.gapMd }}>
            <Text
              style={[styles.emptyTitle, { color: palette.textPrimary }]}
              accessibilityRole="header"
            >
              {t('groups.hubEmptyTabOweTitle')}
            </Text>
            <Text style={[styles.emptyBody, { color: palette.textSecondary }]}>
              {t('groups.hubEmptyTabOweBody')}
            </Text>
          </View>
        );
      }
      if (homeTab === 'get_back') {
        return (
          <View style={{ paddingTop: space.gapLg, gap: space.gapMd }}>
            <Text
              style={[styles.emptyTitle, { color: palette.textPrimary }]}
              accessibilityRole="header"
            >
              {t('groups.hubEmptyTabGetBackTitle')}
            </Text>
            <Text style={[styles.emptyBody, { color: palette.textSecondary }]}>
              {t('groups.hubEmptyTabGetBackBody')}
            </Text>
          </View>
        );
      }
      return (
        <View style={{ paddingTop: space.gapLg, gap: space.gapMd }}>
          <Text
            style={[styles.emptyTitle, { color: palette.textPrimary }]}
            accessibilityRole="header"
          >
            {t('groups.hubEmptyTabSettledTitle')}
          </Text>
          <Text style={[styles.emptyBody, { color: palette.textSecondary }]}>
            {t('groups.hubEmptyTabSettledBody')}
          </Text>
        </View>
      );
    }
    return undefined;
  }, [
    filtered.length,
    groups.length,
    homeTab,
    palette.textMuted,
    palette.textPrimary,
    palette.textSecondary,
    query,
    t,
  ]);

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: palette.balancesCanvas }]}
    >
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        ItemSeparatorComponent={itemSeparator}
        removeClippedSubviews={false}
        contentContainerStyle={{
          paddingTop: spacing['3'],
          paddingBottom: scrollBottomPadding + spacing['10'],
          paddingHorizontal: layoutGrid.inset,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={handlePullRefresh}
            tintColor={palette.accent}
            colors={[palette.accent]}
          />
        }
      />
    </SafeAreaView>
  );
}

export function GroupsHomeInitialLoading({
  scrollBottomPadding,
}: {
  scrollBottomPadding: number;
}): ReactElement {
  const palette = useThemeColors();

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.safe,
        { backgroundColor: palette.balancesCanvas, paddingBottom: scrollBottomPadding },
      ]}
    >
      <View style={styles.loadingBody}>
        <ActivityIndicator size="small" color={palette.accent} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hubChromeRoot: {
    paddingTop: spacing['1'],
    paddingBottom: 0,
  },
  titleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing['3'],
    marginTop: spacing['4'],
  },
  titleCopy: {
    flex: 1,
    minWidth: 0,
  },
  titleProfileSlot: {
    paddingTop: spacing['0.5'],
  },
  searchSlot: {
    marginTop: spacing['8'],
    alignSelf: 'stretch',
  },
  heroTitle: {
    fontFamily: typography.fontFamily.sans.bold,
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize['5xl'] * 0.96,
  },
  heroCaption: {
    fontFamily: typography.fontFamily.sans.regular,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    maxWidth: 520,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: spacing['5'],
    marginBottom: spacing['7'],
  },
  filterHit: {
    flex: 1,
    alignItems: 'flex-start',
    minWidth: 0,
  },
  filterLabel: {
    fontSize: typography.fontSize['2xs'],
    textAlign: 'left',
    letterSpacing: typography.letterSpacing.tight,
    width: '100%',
  },
  filterUnderlineTrack: {
    alignItems: 'flex-start',
    height: StyleSheet.hairlineWidth,
    marginTop: spacing['1'],
    width: '100%',
  },
  filterUnderlineBar: {
    width: FILTER_UNDERLINE_PAD,
    height: StyleSheet.hairlineWidth,
  },
  errorInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapMd,
    paddingVertical: space.gapSm,
    marginTop: space.gapMd,
  },
  errorBody: {
    fontFamily: typography.fontFamily.sans.regular,
    fontSize: typography.fontSize.sm,
  },
  errorRetry: {
    fontFamily: typography.fontFamily.sans.medium,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.sans.semiBold,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.widest,
  },
  emptyBody: {
    fontFamily: typography.fontFamily.sans.regular,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
});
