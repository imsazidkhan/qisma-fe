import { useFocusEffect } from '@react-navigation/native';
import type { ReactElement } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api';
import { Button } from '@/components/ui';
import { InvitesInboxCard } from '@/features/invites/components/InvitesInboxCard';
import { InvitesInboxSkeleton } from '@/features/invites/components/InvitesInboxSkeleton';
import { useGroupInvitesInbox } from '@/features/invites/hooks/useGroupInvitesInbox';
import type { GroupInviteInboxItem } from '@/features/invites/types/groupInviteInbox.types';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { space, textStyles, useThemeColors } from '@/theme';

export type InvitesInboxScreenProps = {
  /**
   * `fullscreen` — own top safe area (legacy tab layout).
   * `embedded` — parent provides safe area + chrome (home stack).
   */
  presentation?: 'fullscreen' | 'embedded';
};

function ScreenWrap(props: {
  presentation: 'fullscreen' | 'embedded';
  style?: { flex?: number; backgroundColor?: string; paddingTop?: number };
  children: React.ReactNode;
}): ReactElement {
  const { presentation, style, children } = props;
  const palette = useThemeColors();
  const base = { flex: 1 as const, backgroundColor: palette.background, ...style };
  if (presentation === 'embedded') {
    return <View style={base}>{children}</View>;
  }
  return (
    <SafeAreaView edges={['top']} style={base}>
      {children}
    </SafeAreaView>
  );
}

/**
 * Inbox UI for pending group invites (`GET /v1/users/me/group-invites` via {@link useGroupInvitesInbox}).
 */
export function InvitesInboxScreen({
  presentation = 'fullscreen',
}: InvitesInboxScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const { isOnline, isReady } = useNetworkStatus();
  const {
    data,
    isPending,
    isError,
    isFetching,
    refetch,
    error: inboxError,
  } = useGroupInvitesInbox();

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const list = data ?? [];
  const showInitialLoader = isPending && data === undefined;
  const showOfflineBanner = isReady && !isOnline;

  const onRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const keyExtractor = useCallback((item: GroupInviteInboxItem) => item.groupId, []);

  const renderItem = useCallback(
    ({ item }: { item: GroupInviteInboxItem }) => (
      <InvitesInboxCard item={item} offline={!isOnline} />
    ),
    [isOnline],
  );

  if (showInitialLoader) {
    return (
      <ScreenWrap presentation={presentation}>
        <View style={{ paddingHorizontal: space.screenPadding, paddingTop: space.gapMd }}>
          <Text style={[textStyles.h2, { color: palette.textPrimary }]} accessibilityRole="header">
            {t('invites.title')}
          </Text>
        </View>
        <InvitesInboxSkeleton />
      </ScreenWrap>
    );
  }

  if (isError) {
    return (
      <ScreenWrap presentation={presentation}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: space.screenPadding,
            paddingTop: presentation === 'embedded' ? 0 : space.gapMd,
          }}
        >
          <Text style={[textStyles.h2, { color: palette.textPrimary }]} accessibilityRole="header">
            {t('invites.title')}
          </Text>
          <Text
            style={[textStyles.h3, { color: palette.textPrimary, marginTop: space.sectionGap }]}
            accessibilityRole="header"
          >
            {t('invites.loadErrorTitle')}
          </Text>
          <Text style={[textStyles.body, { color: palette.textSecondary, marginTop: space.gapMd }]}>
            {t('invites.loadErrorBody')}
          </Text>
          {inboxError instanceof ApiError ? (
            <Text
              style={[textStyles.caption, { color: palette.textMuted, marginTop: space.gapSm }]}
              accessibilityRole="text"
            >
              {inboxError.code}
            </Text>
          ) : null}
          <Button
            label={t('invites.retry')}
            variant="secondary"
            onPress={onRetry}
            accessibilityLabel={t('invites.retryA11y')}
            style={{ marginTop: space.sectionGap, alignSelf: 'flex-start' }}
            trailing="none"
          />
        </View>
      </ScreenWrap>
    );
  }

  if (list.length === 0) {
    return (
      <ScreenWrap presentation={presentation}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: space.screenPadding,
            paddingBottom: space.sectionGapLg,
          }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={() => void refetch()}
              tintColor={palette.accent}
            />
          }
        >
          {showOfflineBanner ? (
            <Text
              style={[
                textStyles.caption,
                { color: palette.warningText, marginBottom: space.gapMd },
              ]}
              accessibilityLiveRegion="polite"
            >
              {t('invites.offlineBanner')}
            </Text>
          ) : null}
          <Text style={[textStyles.h2, { color: palette.textPrimary }]} accessibilityRole="header">
            {t('invites.title')}
          </Text>
          <Text
            style={[textStyles.body, { color: palette.textSecondary, marginTop: space.sectionGap }]}
          >
            {t('invites.emptyTitle')}
          </Text>
          <Text style={[textStyles.body, { color: palette.textMuted, marginTop: space.gapMd }]}>
            {t('invites.emptyBody')}
          </Text>
        </ScrollView>
      </ScreenWrap>
    );
  }

  return (
    <ScreenWrap presentation={presentation} style={{ paddingTop: space.gapMd }}>
      <FlatList
        style={{ flex: 1 }}
        data={list}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isPending}
            onRefresh={() => void refetch()}
            tintColor={palette.accent}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: space.screenPadding,
          paddingBottom: space.sectionGapLg,
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: space.gapMd }}>
            {showOfflineBanner ? (
              <Text
                style={[
                  textStyles.caption,
                  { color: palette.warningText, marginBottom: space.gapMd },
                ]}
                accessibilityLiveRegion="polite"
              >
                {t('invites.offlineBanner')}
              </Text>
            ) : null}
            <Text
              style={[textStyles.h2, { color: palette.textPrimary }]}
              accessibilityRole="header"
            >
              {t('invites.title')}
            </Text>
          </View>
        }
      />
    </ScreenWrap>
  );
}
