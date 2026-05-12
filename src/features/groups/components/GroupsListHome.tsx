import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeaderButton, ThemeToggle } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { GroupListCard } from '@/features/groups/components/GroupListCard';
import type { GroupListItem } from '@/features/groups/types/groupsList.types';
import { formatGroupsHubInlineMeta } from '@/features/groups/utils/formatGroupsHubInlineMeta';
import {
  radius,
  size,
  space,
  spacing,
  textStyles,
  typography,
  useThemeColors,
  zIndex,
} from '@/theme';

export type GroupsListHomeProps = {
  groups: GroupListItem[];
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  onRefresh: () => void;
  scrollBottomPadding: number;
  onGroupPress?: (groupId: string) => void;
  onHomeBackPress?: () => void;
};

type BalanceFilter = 'all' | 'owe' | 'owed' | 'settled';

function toneMatchesFilter(item: GroupListItem, f: BalanceFilter): boolean {
  if (f === 'all') return true;
  if (f === 'owe') return item.balance.tone === 'you_owe';
  if (f === 'owed') return item.balance.tone === 'owed_to_you';
  return item.balance.tone === 'settled';
}

type HubChromeProps = {
  query: string;
  onQueryChange: (q: string) => void;
  balanceFilter: BalanceFilter;
  onBalanceFilterChange: (f: BalanceFilter) => void;
  hubMetaLine: string | null;
  isError: boolean;
  onRetry: () => void;
  onHomeBackPress?: () => void;
};

const GroupsHubChrome = memo(function GroupsHubChrome({
  query,
  onQueryChange,
  balanceFilter,
  onBalanceFilterChange,
  hubMetaLine,
  isError,
  onRetry,
  onHomeBackPress,
}: HubChromeProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();

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
          id: 'owed' as const,
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

  return (
    <View style={{ paddingBottom: space.gapMd }}>
      <View style={styles.topToolbar} accessibilityRole="toolbar">
        {onHomeBackPress ? (
          <BackHeaderButton
            onPress={onHomeBackPress}
            accessibilityLabel={t('common.backToHomeA11y')}
          />
        ) : (
          <View style={{ width: size.touchMin }} />
        )}
        <View style={styles.topToolbarSpacer} />
        <ThemeToggle variant="compact" />
      </View>

      <View style={styles.headerTitlesBlock}>
        <Text
          style={[textStyles.displayMedium, { color: palette.textPrimary }]}
          accessibilityRole="header"
        >
          {t('groups.title')}
        </Text>
        <Text
          style={[
            textStyles.body,
            {
              color: palette.textLabel,
              marginTop: space.gapSm,
              lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
            },
          ]}
        >
          {t('groups.subtitle')}
        </Text>
        {hubMetaLine ? (
          <Text
            style={[styles.hubMetaInline, { color: palette.textSecondary }]}
            accessibilityRole="text"
          >
            {hubMetaLine}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.searchShell,
          {
            borderColor: palette.borderDivider,
            backgroundColor: palette.surfaceBase,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={size.iconSm}
          color={palette.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder={t('groups.searchPlaceholder')}
          placeholderTextColor={palette.placeholder}
          cursorColor={palette.cursor}
          selectionColor={palette.selection}
          style={[styles.searchInput, { color: palette.textPrimary }]}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
          accessibilityLabel={t('groups.searchA11y')}
        />
      </View>

      <View style={styles.filterRow}>
        {segments.map((seg) => {
          const selected = balanceFilter === seg.id;
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
                    color: selected ? palette.textPrimary : palette.textMuted,
                    fontFamily: selected
                      ? typography.fontFamily.mono.medium
                      : typography.fontFamily.mono.regular,
                  },
                ]}
              >
                {seg.label}
              </Text>
              <View
                style={[
                  styles.filterUnderline,
                  {
                    height: selected ? spacing['0.5'] : StyleSheet.hairlineWidth,
                    backgroundColor: selected ? palette.textPrimary : 'transparent',
                  },
                ]}
              />
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
          <Text style={[textStyles.caption, { color: palette.textSecondary, flex: 1 }]}>
            {t('groups.loadError')}
          </Text>
          <Text style={[textStyles.labelSmall, { color: palette.accent }]}>
            {t('groups.retry')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
});

export function GroupsListHome({
  groups,
  isFetching,
  isError,
  onRetry,
  onRefresh,
  scrollBottomPadding,
  onGroupPress,
  onHomeBackPress,
}: GroupsListHomeProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const [query, setQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>('all');
  const [pullRefreshing, setPullRefreshing] = useState(false);

  useEffect(() => {
    if (!isFetching && pullRefreshing) {
      setPullRefreshing(false);
    }
  }, [isFetching, pullRefreshing]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const searchFiltered =
      q.length === 0 ? groups : groups.filter((g) => g.name.toLowerCase().includes(q));
    return searchFiltered.filter((g) => toneMatchesFilter(g, balanceFilter));
  }, [balanceFilter, groups, query]);

  const hubMetaLine = useMemo(() => formatGroupsHubInlineMeta(filtered, t), [filtered, t]);

  const renderItem: ListRenderItem<GroupListItem> = useCallback(
    ({ item }) => (
      <GroupListCard item={item} onPress={onGroupPress ? () => onGroupPress(item.id) : undefined} />
    ),
    [onGroupPress],
  );

  const itemSeparator = useCallback(() => <View style={{ height: space.gapSm }} />, []);

  const keyExtractor = useCallback((item: GroupListItem) => item.id, []);

  const handlePullRefresh = useCallback(() => {
    setPullRefreshing(true);
    onRefresh();
  }, [onRefresh]);

  const listHeader = useMemo(
    () => (
      <GroupsHubChrome
        query={query}
        onQueryChange={setQuery}
        balanceFilter={balanceFilter}
        onBalanceFilterChange={setBalanceFilter}
        hubMetaLine={hubMetaLine}
        isError={isError}
        onRetry={onRetry}
        onHomeBackPress={onHomeBackPress}
      />
    ),
    [balanceFilter, hubMetaLine, isError, onHomeBackPress, onRetry, query],
  );

  const emptyComponent = useMemo(() => {
    if (filtered.length > 0) {
      return undefined;
    }
    if (groups.length === 0) {
      return (
        <View style={{ paddingTop: space.gapLg, gap: space.gapMd }}>
          <Text
            style={[textStyles.label, { color: palette.textPrimary }]}
            accessibilityRole="header"
          >
            {t('groups.hubEmptyTitle')}
          </Text>
          <Text style={[textStyles.body, { color: palette.textSecondary }]}>
            {t('groups.hubEmptyBody')}
          </Text>
        </View>
      );
    }
    return (
      <Text
        style={[
          textStyles.body,
          { color: palette.textMuted, textAlign: 'center', paddingTop: space.gapLg },
        ]}
      >
        {t('groups.searchEmpty')}
      </Text>
    );
  }, [
    filtered.length,
    groups.length,
    palette.textMuted,
    palette.textPrimary,
    palette.textSecondary,
    t,
  ]);

  const fabBottom = scrollBottomPadding + space.gapMd;

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        ItemSeparatorComponent={itemSeparator}
        contentContainerStyle={{
          paddingTop: space.gapMd,
          paddingBottom: scrollBottomPadding + space.gapLg + size.touchMin,
          paddingHorizontal: space.screenPaddingSm,
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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('groups.fabNewGroupA11y')}
        accessibilityHint={t('groups.fabNewGroupHint')}
        onPress={() => router.push(ROUTES.HOME_CREATE_GROUP)}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: palette.textPrimary,
            bottom: fabBottom,
            opacity: pressed ? 0.88 : 1,
            zIndex: zIndex.sticky,
            elevation: Platform.OS === 'android' ? 6 : 0,
          },
        ]}
      >
        <Text style={[styles.fabLabel, { color: palette.background }]}>
          {t('groups.fabNewGroup').toUpperCase()}
        </Text>
      </Pressable>
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
        { backgroundColor: palette.background, paddingBottom: scrollBottomPadding },
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
  topToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.gapMd,
    minHeight: size.touchMin,
  },
  topToolbarSpacer: {
    flex: 1,
  },
  headerTitlesBlock: {
    width: '100%',
    marginBottom: space.gapMd,
  },
  hubMetaInline: {
    ...textStyles.caption,
    fontFamily: typography.fontFamily.sans.regular,
    marginTop: space.gapSm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xs,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.gapSm,
    minHeight: spacing['6'],
    marginBottom: space.gapMd,
  },
  searchIcon: { marginRight: space.gapSm },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.sans.regular,
    fontSize: typography.fontSize.sm,
    paddingVertical: spacing['1'],
    margin: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: space.gapSm,
    marginBottom: space.gapMd,
  },
  filterHit: {
    flex: 1,
    paddingVertical: space.gapSm,
    paddingHorizontal: space.gapSm,
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: typography.fontSize['2xs'],
    letterSpacing: typography.letterSpacing.widest,
    textAlign: 'center',
  },
  filterUnderline: {
    marginTop: space.gapSm,
    alignSelf: 'stretch',
  },
  errorInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapMd,
    paddingVertical: space.gapSm,
    marginBottom: space.gapSm,
  },
  fab: {
    position: 'absolute',
    right: space.screenPaddingSm,
    paddingVertical: space.gapMd,
    paddingHorizontal: space.gapMd,
    borderRadius: radius.sm,
    maxWidth: '88%',
  },
  fabLabel: {
    fontFamily: typography.fontFamily.mono.medium,
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.widest,
  },
});
