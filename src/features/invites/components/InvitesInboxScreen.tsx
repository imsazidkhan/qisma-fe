import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from '@react-navigation/native';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api';
import { Button } from '@/components/ui';
import { DotMatrixField } from '@/features/invites/components/DotMatrixField';
import { InvitesEmptyState } from '@/features/invites/components/InvitesEmptyState';
import { InvitesInboxCard } from '@/features/invites/components/InvitesInboxCard';
import type { InvitesInboxTab } from '@/features/invites/components/InvitesInboxSegments';
import { InvitesInboxSegments } from '@/features/invites/components/InvitesInboxSegments';
import { InvitesInboxSkeleton } from '@/features/invites/components/InvitesInboxSkeleton';
import { useGroupInvitesInbox } from '@/features/invites/hooks/useGroupInvitesInbox';
import type { GroupInviteInboxItem } from '@/features/invites/types/groupInviteInbox.types';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { space, textStyles, useThemeColors } from '@/theme';

export type InvitesInboxScreenProps = {
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
 * Pending group invites — `GET /v1/users/me/group-invites`.
 */
export function InvitesInboxScreen({
  presentation = 'fullscreen',
}: InvitesInboxScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const { isOnline, isReady } = useNetworkStatus();
  const [inboxTab, setInboxTab] = useState<InvitesInboxTab>('pending');
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
      <View style={{ marginBottom: space.gapLg }}>
        <InvitesInboxCard item={item} offline={!isOnline} />
      </View>
    ),
    [isOnline],
  );

  const headerNode = useMemo(
    () => (
      <View style={{ gap: space.gapMd, marginBottom: space.gapLg }}>
        {showOfflineBanner ? (
          <Text
            style={[textStyles.caption, { color: palette.warningText }]}
            accessibilityLiveRegion="polite"
          >
            {t('invites.offlineBanner')}
          </Text>
        ) : null}
        <DotMatrixField height={48} rows={4} columns={14} />
        <View style={styles.titleRow}>
          <Text
            style={[textStyles.h1, { color: palette.textPrimary, flex: 1 }]}
            accessibilityRole="header"
          >
            {t('invites.title')}
          </Text>
          {list.length > 0 ? (
            <View
              style={[
                styles.badge,
                {
                  borderColor: palette.borderFrost,
                  backgroundColor: palette.surfaceFloating,
                },
              ]}
              accessibilityLabel={t('invites.headerBadgeA11y', { count: list.length })}
            >
              <Text
                style={[
                  textStyles.labelSmall,
                  { fontVariant: ['tabular-nums'], color: palette.textPrimary },
                ]}
              >
                {list.length > 99 ? '99+' : String(list.length)}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[textStyles.caption, { color: palette.textSecondary }]}>
          {inboxTab === 'pending'
            ? t('invites.segmentPendingSubtitle')
            : t('invites.segmentAllSubtitle')}
        </Text>
        <InvitesInboxSegments
          value={inboxTab}
          onChange={setInboxTab}
          pendingBadgeCount={list.length}
          pendingLabel={t('invites.segmentPending')}
          allLabel={t('invites.segmentAll')}
          accessibilityHint={t('invites.segmentsA11y')}
        />
      </View>
    ),
    [
      inboxTab,
      list.length,
      palette.borderFrost,
      palette.surfaceFloating,
      palette.textPrimary,
      palette.textSecondary,
      palette.warningText,
      showOfflineBanner,
      t,
    ],
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
          {headerNode}
          <InvitesEmptyState
            offline={showOfflineBanner}
            onRetry={showOfflineBanner ? onRetry : undefined}
          />
        </ScrollView>
      </ScreenWrap>
    );
  }

  return (
    <ScreenWrap presentation={presentation} style={{ paddingTop: space.gapMd }}>
      <FlashList
        data={list}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={headerNode}
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
      />
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapMd,
  },
  badge: {
    minWidth: 36,
    paddingHorizontal: space.gapSm,
    paddingVertical: space.gapXs,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
