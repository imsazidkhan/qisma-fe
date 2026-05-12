import { router } from 'expo-router';
import { useCallback, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ListRenderItem, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeaderButton, Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';

import { ActivityFeedRow } from '@/features/activity/components/ActivityFeedRow';
import { ActivityFeedSkeleton } from '@/features/activity/components/ActivityFeedSkeleton';
import { useActivityFeed } from '@/features/activity/hooks/useActivityFeed';
import type { ActivityFeedItem } from '@/features/activity/types/activityFeed.types';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { space, textStyles, useThemeColors } from '@/theme';

export type ActivityFeedScreenProps = {
  contentPaddingBottom: number;
};

export function ActivityFeedScreen({
  contentPaddingBottom,
}: ActivityFeedScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const { isOnline, isReady } = useNetworkStatus();
  const { items, refetchAll, isInitialLoading, isRefreshing, isFatalError } = useActivityFeed();

  const showOfflineBanner = isReady && !isOnline;
  const listEmpty = !isInitialLoading && items.length === 0 && !isFatalError;

  const keyExtractor = useCallback((row: ActivityFeedItem) => row.feedItemId, []);

  const renderItem = useCallback<ListRenderItem<ActivityFeedItem>>(
    ({ item }) => <ActivityFeedRow item={item} />,
    [],
  );

  const listHeader = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.gapMd }}>
        <BackHeaderButton
          onPress={() => router.navigate(ROUTES.HOME)}
          accessibilityLabel={t('common.backToHomeA11y')}
        />
        <View style={{ flex: 1 }} />
      </View>
      <View style={{ gap: space.gapSm, marginBottom: space.gapMd }}>
        <Text
          style={[textStyles.displaySmall, { color: palette.textPrimary }]}
          accessibilityRole="header"
        >
          {t('activityTab.title')}
        </Text>
        <Text style={[textStyles.body, { color: palette.textSecondary }]}>
          {t('activityFeed.subtitle')}
        </Text>
      </View>
      {showOfflineBanner ? (
        <Text
          style={[
            textStyles.captionSmall,
            { color: palette.warningText, marginBottom: space.gapMd },
          ]}
          accessibilityLiveRegion="polite"
        >
          {t('activityFeed.offlineBanner')}
        </Text>
      ) : null}
    </>
  );

  const paddedContentStyle = {
    paddingHorizontal: space.screenPadding,
    paddingTop: space.sectionGap,
    paddingBottom: contentPaddingBottom,
  } as const;

  if (isInitialLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
        <View style={{ flex: 1, ...paddedContentStyle }}>
          {listHeader}
          <ActivityFeedSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (isFatalError) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
        <View style={{ flex: 1, ...paddedContentStyle }}>
          {listHeader}
          <Text
            style={[textStyles.h3, { color: palette.textPrimary, marginTop: space.gapMd }]}
            accessibilityRole="header"
          >
            {t('activityFeed.loadErrorTitle')}
          </Text>
          <Text style={[textStyles.body, { color: palette.textSecondary, marginTop: space.gapMd }]}>
            {t('activityFeed.loadErrorBody')}
          </Text>
          <View style={{ marginTop: space.sectionGap }}>
            <Button
              variant="secondary"
              label={t('activityFeed.retry')}
              trailing="none"
              onPress={() => {
                refetchAll();
              }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          listEmpty ? (
            <View style={{ paddingTop: space.gapLg }}>
              <Text
                style={[textStyles.h3, { color: palette.textPrimary }]}
                accessibilityRole="header"
              >
                {t('activityFeed.emptyTitle')}
              </Text>
              <Text
                style={[textStyles.body, { color: palette.textSecondary, marginTop: space.gapMd }]}
              >
                {t('activityFeed.emptyBody')}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: space.screenPadding,
          paddingTop: space.sectionGap,
          paddingBottom: contentPaddingBottom,
          gap: space.gap,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refetchAll}
            tintColor={palette.accent}
            colors={[palette.accent]}
          />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
