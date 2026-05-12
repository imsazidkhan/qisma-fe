import { useFocusEffect } from '@react-navigation/native';
import type { TFunction } from 'i18next';
import { Image } from 'expo-image';
import { memo, useCallback, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api';
import { BackHeaderButton, Button } from '@/components/ui';
import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
import { groupActivityScreenStyles as styles } from '@/features/groups/components/groupActivityScreen.styles';
import { useGroupActivity } from '@/features/groups/hooks/useGroupActivity';
import type {
  GroupActivityItem,
  GroupActivityPerson,
} from '@/features/groups/types/groupActivity.types';
import { formatGroupTimestamp } from '@/features/groups/utils/formatGroupTimestamp';
import { platformShadow, space, textStyles, useThemeColors } from '@/theme';

export type GroupActivityScreenProps = {
  groupId: string;
  onBack: () => void;
};

function displayPersonLabel(
  p: GroupActivityPerson | null,
  meId: string | undefined,
  t: TFunction,
): string {
  if (!p) {
    return t('groups.groupActivity.someone');
  }
  if (meId && p.id === meId) {
    return t('groups.detail.hubActivityPaidByYou');
  }
  const name = p.name?.trim();
  if (name) {
    return name;
  }
  const u = p.username?.trim();
  if (u) {
    return `@${u}`;
  }
  return t('groups.membersScreen.anonymousMember');
}

function payloadRecord(item: GroupActivityItem): Record<string, unknown> | null {
  if (!item.payload || typeof item.payload !== 'object' || Array.isArray(item.payload)) {
    return null;
  }
  return item.payload as Record<string, unknown>;
}

function pickPayloadString(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string' && v.trim() !== '') {
      return v.trim();
    }
  }
  return '';
}

function structuredEventTitle(item: GroupActivityItem, t: TFunction): string | null {
  const o = payloadRecord(item);
  if (!o) {
    return null;
  }
  const detail =
    pickPayloadString(o, ['title', 'expenseTitle', 'label']) ||
    pickPayloadString(o, ['category', 'categoryLabel']) ||
    pickPayloadString(o, ['merchant', 'merchantName', 'displayName']);
  const tail = detail ? ` · ${detail}` : '';
  switch (item.type) {
    case 'expense_classified':
      return t('groups.groupActivity.expenseClassified', { tail });
    case 'expense_reclassified':
      return t('groups.groupActivity.expenseReclassified', { tail });
    case 'merchant_recognized': {
      const m = pickPayloadString(o, ['merchant', 'merchantName', 'displayName']);
      return t('groups.groupActivity.merchantRecognized', {
        merchant: m || t('groups.groupActivity.someone'),
      });
    }
    case 'recurring_expense_detected':
      return t('groups.groupActivity.recurringDetected');
    default:
      return null;
  }
}

function eventTitle(item: GroupActivityItem, meId: string | undefined, t: TFunction): string {
  const structured = structuredEventTitle(item, t);
  if (structured) {
    return structured;
  }
  const actor = displayPersonLabel(item.actor, meId, t);
  const subject = displayPersonLabel(item.subject, meId, t);
  switch (item.type) {
    case 'invite_sent':
      return t('groups.groupActivity.inviteSent', { actor, subject });
    case 'invite_accepted':
      return t('groups.groupActivity.inviteAccepted', { name: subject });
    case 'member_joined':
      return t('groups.groupActivity.memberJoined', { name: subject });
    default:
      return t('groups.groupActivity.unknownEvent');
  }
}

function eventKindLabel(type: GroupActivityItem['type'], t: TFunction): string {
  switch (type) {
    case 'expense_classified':
      return t('groups.groupActivity.kindExpenseClassified');
    case 'expense_reclassified':
      return t('groups.groupActivity.kindExpenseReclassified');
    case 'merchant_recognized':
      return t('groups.groupActivity.kindMerchantRecognized');
    case 'recurring_expense_detected':
      return t('groups.groupActivity.kindRecurringDetected');
    case 'invite_sent':
      return t('groups.groupActivity.kindInviteSent');
    case 'invite_accepted':
      return t('groups.groupActivity.kindInviteAccepted');
    case 'member_joined':
      return t('groups.groupActivity.kindMemberJoined');
    default:
      return t('groups.groupActivity.kindUnknown');
  }
}

function primaryFace(item: GroupActivityItem): GroupActivityPerson | null {
  if (item.type === 'invite_sent') {
    return item.actor ?? item.subject;
  }
  return item.subject ?? item.actor;
}

type RowProps = { item: GroupActivityItem; meId: string | undefined };

const GroupActivityRow = memo(function GroupActivityRowInner({
  item,
  meId,
}: RowProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const title = useMemo(() => eventTitle(item, meId, t as TFunction), [item, meId, t]);
  const kind = useMemo(() => eventKindLabel(item.type, t as TFunction), [item.type, t]);
  const meta = useMemo(
    () =>
      t('groups.groupActivity.timeMeta', {
        time: formatGroupTimestamp(item.createdAt, t as TFunction),
      }),
    [item.createdAt, t],
  );
  const face = useMemo(() => primaryFace(item), [item]);
  const avatarUri = face?.avatar?.trim() ?? '';
  const initial = useMemo(() => {
    const base = (face?.name?.trim() || face?.username?.trim() || '?').charAt(0);
    return base ? base.toUpperCase() : '?';
  }, [face?.name, face?.username]);

  return (
    <View
      style={[
        styles.row,
        platformShadow('sm'),
        { borderColor: palette.border, backgroundColor: palette.surfaceElevated },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${kind}. ${title}. ${meta}`}
    >
      <View
        style={[
          styles.avatar,
          { borderColor: palette.border, backgroundColor: palette.surfaceRaised },
        ]}
      >
        {avatarUri.length > 0 ? (
          <Image
            source={{ uri: avatarUri }}
            accessibilityIgnoresInvertColors
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <Text style={[styles.avatarGlyph, { color: palette.textPrimary }]}>{initial}</Text>
        )}
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.kindLabel, { color: palette.textMuted }]}>{kind}</Text>
        <Text style={[styles.rowTitle, { color: palette.textPrimary }]} numberOfLines={3}>
          {title}
        </Text>
        <Text style={[styles.rowMeta, { color: palette.textSecondary }]} numberOfLines={1}>
          {meta}
        </Text>
      </View>
    </View>
  );
});

/**
 * Membership / invite timeline (`GET /v1/groups/:groupId/activity`). For active members only.
 */
export function GroupActivityScreen({ groupId, onBack }: GroupActivityScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const { data: me } = useAuthMe();
  const meId = me?.id;
  const { data, isPending, isError, error, refetch, isFetching } = useGroupActivity(groupId, true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const blocking = useMemo(() => {
    if (!isError || !error || !(error instanceof ApiError)) {
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

  const renderItem = useCallback<ListRenderItem<GroupActivityItem>>(
    ({ item }) => <GroupActivityRow item={item} meId={meId} />,
    [meId],
  );

  const keyExtractor = useCallback((item: GroupActivityItem) => item.id, []);

  const items = data ?? [];

  const listHeader = useMemo(
    () => (
      <View>
        <View style={styles.topRow}>
          <BackHeaderButton onPress={onBack} accessibilityLabel={t('createGroup.backA11y')} />
        </View>
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: palette.textPrimary }]} accessibilityRole="header">
            {t('groups.groupActivity.title')}
          </Text>
          <Text style={[styles.subtitle, { color: palette.textMuted }]}>
            {t('groups.groupActivity.subtitle')}
          </Text>
        </View>
        {isError && !blocking ? (
          <View
            style={[
              styles.errorBanner,
              { borderColor: palette.border, backgroundColor: palette.surfaceElevated },
            ]}
          >
            <Text style={[textStyles.body, { color: palette.textPrimary }]}>
              {t('groups.groupActivity.loadError')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('groups.groupActivity.retryA11y')}
              onPress={() => void refetch()}
              style={({ pressed }) => [
                styles.retryBtn,
                { opacity: pressed ? 0.72 : 1, borderColor: palette.border },
              ]}
            >
              <Text style={[textStyles.label, { color: palette.borderFocus }]}>
                {t('groups.groupActivity.retry')}
              </Text>
            </Pressable>
          </View>
        ) : null}
        {isPending && items.length === 0 ? (
          <ActivityIndicator color={palette.accent} style={{ alignSelf: 'flex-start' }} />
        ) : null}
      </View>
    ),
    [
      blocking,
      isError,
      isPending,
      items.length,
      onBack,
      palette.accent,
      palette.border,
      palette.borderFocus,
      palette.surfaceElevated,
      palette.textMuted,
      palette.textPrimary,
      refetch,
      t,
    ],
  );

  const listEmpty = useMemo(() => {
    if (isPending && items.length === 0) {
      return null;
    }
    if (items.length > 0) {
      return null;
    }
    return (
      <View style={styles.emptyBlock} accessibilityRole="text">
        <Text style={[textStyles.body, { color: palette.textSecondary }]}>
          {t('groups.groupActivity.empty')}
        </Text>
      </View>
    );
  }, [isPending, items.length, palette.textSecondary, t]);

  const listFooter = useMemo(() => {
    if (items.length === 0) {
      return null;
    }
    return (
      <Text style={[styles.footerHint, { color: palette.textMuted }]}>
        {t('groups.groupActivity.recentCap')}
      </Text>
    );
  }, [items.length, palette.textMuted, t]);

  if (blocking === 'not_member') {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
        <View style={[styles.centeredBody, { paddingTop: space.gapMd }]}>
          <View style={styles.topRow}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('createGroup.backA11y')} />
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
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('createGroup.backA11y')} />
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
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing || (isFetching && items.length > 0)}
            onRefresh={() => void onRefresh()}
            tintColor={palette.accent}
            colors={[palette.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
