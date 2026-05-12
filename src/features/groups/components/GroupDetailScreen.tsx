import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { TFunction } from 'i18next';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/api';
import { BackHeaderButton, Button } from '@/components/ui';
import { hrefGroupActivity, hrefGroupAnalytics, hrefGroupBalances } from '@/constants/routes';
import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
import { deleteGroup } from '@/features/groups/api/groupsApi';
import { GroupHubBalanceSummaryCard } from '@/features/groups/components/GroupHubBalanceSummaryCard';
import { groupDetailScreenStyles as styles } from '@/features/groups/components/groupDetailScreen.styles';
import { GROUP_TYPE_EMOJI } from '@/features/groups/constants/groupTypes';
import {
  useAcceptGroupInvite,
  useDeclineGroupInvite,
  useGroupMembers,
} from '@/features/groups/hooks/useGroupMembers';
import { useGroupBalancesSnapshot } from '@/features/groups/hooks/useGroupBalancesSnapshot';
import { useGroupsList } from '@/features/groups/hooks/useGroupsList';
import type { Group } from '@/features/groups/types/group.types';
import {
  formatMinorAsCurrency,
  formatMinorAsCurrencyCompact,
} from '@/features/groups/utils/formatMinorAsCurrency';
import {
  formatGroupCreatedRelative,
  formatGroupTimestamp,
} from '@/features/groups/utils/formatGroupTimestamp';
import { findActorRole } from '@/features/groups/utils/memberRosterPermissions';
import { mapInviteFlowError } from '@/features/invites/utils/mapInviteFlowError';
import {
  DEFAULT_GROUP_EXPENSE_FEED_FILTERS,
  EXPENSE_FEED_ERROR_CODES,
  GroupExpenseFeedRow,
  expensesQueryKeys,
  useGroupExpenseFeed,
  stableExpenseFeedFiltersKey,
  type GroupExpenseFeedItem,
} from '@/features/expenses';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { platformShadow, space, textStyles, useThemeColors, useThemeMode } from '@/theme';

const OVERFLOW_MENU_WIDTH = 228;
const HERO_MEMBER_FACE_CAP = 2;

export type GroupDetailScreenProps = {
  group: Group;
  onBack: () => void;
  onAfterRemoved: () => void;
  fetchMembersRoster?: boolean;
};

export function GroupDetailScreen({
  group,
  onBack,
  onAfterRemoved,
  fetchMembersRoster = true,
}: GroupDetailScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const themeMode = useThemeMode();
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const overflowAnchorRef = useRef<View>(null);
  const insets = useSafeAreaInsets();

  const { data: me } = useAuthMe();
  const rosterQuery = useGroupMembers(group.id, { enabled: fetchMembersRoster });
  const rosterList = useMemo(() => rosterQuery.data ?? [], [rosterQuery.data]);
  const rosterPending = fetchMembersRoster && rosterQuery.isPending;

  const { isOnline, isReady } = useNetworkStatus();
  const offlineInvite = !fetchMembersRoster && isReady && !isOnline;
  const acceptInviteMutation = useAcceptGroupInvite(group.id);
  const declineInviteMutation = useDeclineGroupInvite(group.id);
  const inviteActionBusy =
    !fetchMembersRoster && (acceptInviteMutation.isPending || declineInviteMutation.isPending);

  const queryClient = useQueryClient();
  const feedFilterKey = useMemo(
    () => stableExpenseFeedFiltersKey(DEFAULT_GROUP_EXPENSE_FEED_FILTERS),
    [],
  );
  const expenseFeed = useGroupExpenseFeed(
    fetchMembersRoster ? group.id : undefined,
    DEFAULT_GROUP_EXPENSE_FEED_FILTERS,
    {
      enabled: fetchMembersRoster,
    },
  );
  const expenseItems = useMemo(
    () => expenseFeed.data?.pages.flatMap((p) => p.items) ?? [],
    [expenseFeed.data],
  );

  const typeEmoji = GROUP_TYPE_EMOJI[group.type];
  const typeLabel = t(`createGroup.types.${group.type}`);

  const actorRole = useMemo(() => findActorRole(rosterList, me?.id), [rosterList, me?.id]);
  const isGroupCreator = useMemo(
    () => Boolean(group.createdByUserId && me?.id && group.createdByUserId === me.id),
    [group.createdByUserId, me?.id],
  );
  const canAddMembers =
    fetchMembersRoster && (actorRole === 'owner' || actorRole === 'admin' || isGroupCreator);
  const canDeleteGroup =
    fetchMembersRoster && (actorRole === 'owner' || actorRole === 'admin' || isGroupCreator);

  const { data: myGroups } = useGroupsList();
  const listRow = useMemo(() => myGroups?.find((r) => r.id === group.id), [group.id, myGroups]);

  const balancesQuery = useGroupBalancesSnapshot(fetchMembersRoster ? group.id : undefined, {
    enabled: fetchMembersRoster,
  });

  const viewerPayload = balancesQuery.data;

  const balanceFromViewer = useMemo((): {
    tone: 'settled' | 'you_owe' | 'owed_to_you';
    amountMinor: number;
    currency: string;
  } | null => {
    if (!viewerPayload) {
      return null;
    }
    const s = viewerPayload.summary;
    const tone =
      s.status === 'settled'
        ? ('settled' as const)
        : s.status === 'you_owe'
          ? ('you_owe' as const)
          : ('owed_to_you' as const);
    return {
      tone,
      amountMinor: s.netAmount,
      currency: s.currency,
    };
  }, [viewerPayload]);

  const balance = useMemo(
    () =>
      balanceFromViewer ??
      listRow?.balance ?? {
        tone: 'settled' as const,
        amountMinor: 0,
        currency: 'INR',
      },
    [balanceFromViewer, listRow],
  );

  const headcount = useMemo(() => {
    if (!fetchMembersRoster) {
      const c = group.memberCount;
      if (typeof c === 'number' && c >= 0) return c;
      return listRow?.memberCount ?? 0;
    }
    if (rosterPending) {
      return listRow?.memberCount ?? group.memberCount ?? rosterList.length;
    }
    return rosterList.filter((r) => r.status === 'active').length;
  }, [fetchMembersRoster, group.memberCount, listRow?.memberCount, rosterList, rosterPending]);

  const memberLineLabel = useMemo(() => {
    if (headcount <= 0) {
      if (fetchMembersRoster && rosterPending) {
        return t('groups.detail.hubMemberLineLoading');
      }
      return t('groups.detail.hubMemberLineZero');
    }
    return headcount === 1
      ? t('groups.members_one', { count: headcount })
      : t('groups.members_other', { count: headcount });
  }, [fetchMembersRoster, headcount, rosterPending, t]);

  const activeMembersStrip = useMemo(() => {
    return rosterList
      .filter((r) => r.status === 'active')
      .slice()
      .sort((a, b) => {
        const an = (a.name ?? a.username ?? '').toLowerCase();
        const bn = (b.name ?? b.username ?? '').toLowerCase();
        return an.localeCompare(bn);
      });
  }, [rosterList]);

  const heroMemberRowModel = useMemo(() => {
    const cap = HERO_MEMBER_FACE_CAP;
    if (activeMembersStrip.length > 0) {
      return {
        mode: 'roster' as const,
        faces: activeMembersStrip.slice(0, cap),
        overflow: Math.max(0, activeMembersStrip.length - cap),
        total: activeMembersStrip.length,
      };
    }
    if (headcount <= 0) {
      return null;
    }
    if (!fetchMembersRoster || rosterPending) {
      const placeholders = Math.min(cap, headcount);
      return {
        mode: 'placeholder' as const,
        placeholders,
        overflow: Math.max(0, headcount - cap),
        total: headcount,
      };
    }
    return null;
  }, [activeMembersStrip, fetchMembersRoster, headcount, rosterPending]);

  const heroMetaLine = useMemo(() => {
    const iso = group.createdAt.trim();
    const createdPart =
      iso.length > 0 ? formatGroupCreatedRelative(iso, t) : t('groups.detail.hubCreatedUnknown');
    return `${memberLineLabel} · ${createdPart}`;
  }, [group.createdAt, memberLineLabel, t]);

  type BalanceCardTone = 'settled' | 'owed_to_you' | 'you_owe' | 'preview';

  const balanceCard = useMemo((): { label: string; tone: BalanceCardTone } => {
    if (!fetchMembersRoster) {
      return { label: t('groups.detail.hubBalancePreviewHint'), tone: 'preview' };
    }
    if (viewerPayload) {
      const s = viewerPayload.summary;
      const tone: BalanceCardTone =
        s.status === 'settled' ? 'settled' : s.status === 'you_owe' ? 'you_owe' : 'owed_to_you';
      return { label: s.displayText, tone };
    }
    const { tone, amountMinor, currency } = balance;
    if (tone === 'settled') {
      return { label: t('groups.balance.settled'), tone: 'settled' };
    }
    const amt = formatMinorAsCurrency(amountMinor, currency);
    if (tone === 'owed_to_you') {
      return { label: t('groups.balance.owedToYou', { amount: amt }), tone: 'owed_to_you' };
    }
    return { label: t('groups.balance.youOwe', { amount: amt }), tone: 'you_owe' };
  }, [balance, fetchMembersRoster, t, viewerPayload]);

  const balanceHeroModel = useMemo(() => {
    if (!fetchMembersRoster) {
      return null;
    }
    const tone = balanceCard.tone;

    const currency = viewerPayload?.summary.currency ?? balance.currency;

    const activeBalanceFootline = viewerPayload
      ? {
          count: viewerPayload.balances.length,
          status: viewerPayload.summary.status,
        }
      : undefined;

    if (tone === 'settled') {
      const netMinor = viewerPayload ? viewerPayload.summary.netAmount : 0;
      const amountStr = formatMinorAsCurrencyCompact(netMinor, currency);
      return {
        variant: 'settled' as const,
        eyebrow: t('groups.detail.hubBalanceHeroLabelSettled'),
        amountStr,
        activeBalanceFootline,
      };
    }

    const netMinor = viewerPayload?.summary.netAmount ?? balance.amountMinor;
    const amountStr = formatMinorAsCurrencyCompact(netMinor, currency);
    const eyebrow =
      tone === 'owed_to_you'
        ? t('groups.detail.hubBalanceHeroLabelCredit')
        : t('groups.detail.hubBalanceHeroLabelDebit');

    return {
      variant: 'active' as const,
      tone,
      eyebrow,
      amountStr,
      activeBalanceFootline,
    };
  }, [balance, balanceCard.tone, fetchMembersRoster, t, viewerPayload]);

  const onHubRefresh = useCallback(() => {
    void Promise.all([balancesQuery.refetch(), expenseFeed.refetch()]);
  }, [balancesQuery, expenseFeed]);

  const hubBottomSafePadding = insets.bottom + space.gapLg;
  const expenseFabBottomOffset = insets.bottom + space.gapMd;
  const hubScrollBottomPadding = useMemo(() => {
    const fabClearance = fetchMembersRoster ? space.gapXl + space.gapLg : 0;
    return space.gapLg + hubBottomSafePadding + fabClearance;
  }, [fetchMembersRoster, hubBottomSafePadding]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setMenuPos(null);
  }, []);

  const closeAbout = useCallback(() => {
    setAboutOpen(false);
  }, []);

  const onExpenseFeedRetry = useCallback(() => {
    if (
      expenseFeed.error instanceof ApiError &&
      expenseFeed.error.code === EXPENSE_FEED_ERROR_CODES.INVALID_EXPENSE_CURSOR
    ) {
      queryClient.removeQueries({
        queryKey: expensesQueryKeys.groupFeed(group.id, feedFilterKey),
      });
    }
    void expenseFeed.refetch();
  }, [expenseFeed, feedFilterKey, group.id, queryClient]);

  const formatDate = useCallback((iso: string) => formatGroupTimestamp(iso, t), [t]);

  const runDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteGroup(group.id);
      onAfterRemoved();
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'GROUP_NOT_FOUND' || e.status === 404)) {
        Alert.alert(t('groups.detail.deleteGoneTitle'), t('groups.detail.deleteGoneBody'), [
          { text: t('common.ok'), onPress: onAfterRemoved },
        ]);
        return;
      }
      Alert.alert(t('groups.detail.deleteErrorTitle'), t('groups.detail.deleteErrorBody'));
    } finally {
      setIsDeleting(false);
    }
  }, [group.id, onAfterRemoved, t]);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      t('groups.detail.deleteConfirmTitle'),
      t('groups.detail.deleteConfirmMessage', { name: group.name }),
      [
        { text: t('groups.detail.deleteConfirmCancel'), style: 'cancel' },
        {
          text: t('groups.detail.deleteConfirmCta'),
          style: 'destructive',
          onPress: () => void runDelete(),
        },
      ],
    );
  }, [group.name, runDelete, t]);

  const openOverflowMenu = useCallback(() => {
    if (isDeleting) return;
    void Haptics.selectionAsync().catch(() => {});
    const anchorToMenuPos = (
      x: number,
      y: number,
      w: number,
      h: number,
    ): { top: number; left: number } => {
      const winW = Dimensions.get('window').width;
      const pad = space.screenPaddingLg;
      const left = Math.max(
        pad,
        Math.min(x + w - OVERFLOW_MENU_WIDTH, winW - OVERFLOW_MENU_WIDTH - pad),
      );
      return { top: y + h + space.gapSm, left };
    };
    const applyMeasure = (x: number, y: number, w: number, h: number): void => {
      if (w < 1 || h < 1) {
        requestAnimationFrame(() => {
          overflowAnchorRef.current?.measureInWindow((x2, y2, w2, h2) => {
            if (w2 < 1 || h2 < 1) return;
            setMenuPos(anchorToMenuPos(x2, y2, w2, h2));
            setMenuOpen(true);
          });
        });
        return;
      }
      setMenuPos(anchorToMenuPos(x, y, w, h));
      setMenuOpen(true);
    };
    requestAnimationFrame(() => {
      overflowAnchorRef.current?.measureInWindow(applyMeasure);
    });
  }, [isDeleting]);

  const onAboutRowPress = useCallback(() => {
    closeMenu();
    queueMicrotask(() => setAboutOpen(true));
  }, [closeMenu]);

  const onDeleteRowPress = useCallback(() => {
    closeMenu();
    queueMicrotask(() => confirmDelete());
  }, [closeMenu, confirmDelete]);

  const runAcceptInviteHub = useCallback(() => {
    if (offlineInvite || isDeleting) return;
    acceptInviteMutation.mutate(undefined, {
      onSuccess: () => {
        router.replace(`/home/group/${group.id}`);
      },
      onError: (e) => {
        const msg =
          e instanceof ApiError
            ? mapInviteFlowError(e, t as TFunction)
            : t('groups.membersScreen.inviteAcceptErrorGeneric');
        Alert.alert(t('groups.membersScreen.inviteAcceptErrorTitle'), msg);
      },
    });
  }, [acceptInviteMutation, group.id, isDeleting, offlineInvite, t]);

  const confirmDeclineInviteHub = useCallback(() => {
    if (offlineInvite || isDeleting) return;
    Alert.alert(
      t('groups.membersScreen.declineInviteConfirmTitle'),
      t('groups.membersScreen.declineInviteConfirmBody'),
      [
        { text: t('groups.membersScreen.declineInviteConfirmCancel'), style: 'cancel' },
        {
          text: t('groups.membersScreen.declineInviteConfirmCta'),
          style: 'destructive',
          onPress: () => {
            void declineInviteMutation.mutateAsync().then(
              () => {
                onBack();
              },
              (e) => {
                const msg =
                  e instanceof ApiError
                    ? mapInviteFlowError(e, t as TFunction)
                    : t('groups.membersScreen.inviteDeclineErrorGeneric');
                Alert.alert(t('groups.membersScreen.inviteDeclineErrorTitle'), msg);
              },
            );
          },
        },
      ],
    );
  }, [declineInviteMutation, isDeleting, offlineInvite, onBack, t]);

  const onPrimaryCtaPress = useCallback(() => {
    if (isDeleting) return;
    void Haptics.selectionAsync().catch(() => {});
    if (!fetchMembersRoster) {
      return;
    }
    if (canAddMembers) {
      router.push(`/home/group/${group.id}/members?openAdd=1`);
      return;
    }
    router.push(`/home/group/${group.id}/members`);
  }, [canAddMembers, fetchMembersRoster, group.id, isDeleting]);

  const onMembersPress = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    router.push(`/home/group/${group.id}/members`);
  }, [group.id]);

  const onOpenAddExpense = useCallback(() => {
    if (isDeleting) return;
    void Haptics.selectionAsync().catch(() => {});
    router.push(`/home/group/${group.id}/add-expense`);
  }, [group.id, isDeleting]);

  const onOpenGroupTimeline = useCallback(() => {
    if (isDeleting) return;
    void Haptics.selectionAsync().catch(() => {});
    router.push(hrefGroupActivity(group.id));
  }, [group.id, isDeleting]);

  const onOpenBalancesScreen = useCallback(() => {
    if (isDeleting) return;
    void Haptics.selectionAsync().catch(() => {});
    router.push(hrefGroupBalances(group.id));
  }, [group.id, isDeleting]);

  const onOpenAnalyticsScreen = useCallback(() => {
    if (isDeleting) return;
    void Haptics.selectionAsync().catch(() => {});
    router.push(hrefGroupAnalytics(group.id));
  }, [group.id, isDeleting]);

  const onSettleSoon = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    Alert.alert(t('groups.detail.settleSoonTitle'), t('groups.detail.settleSoonBody'));
  }, [t]);

  const onNotesSoon = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    Alert.alert(t('groups.detail.notesSoonTitle'), t('groups.detail.notesSoonBody'));
  }, [t]);

  const onOverflowMembersPress = useCallback(() => {
    closeMenu();
    queueMicrotask(() => {
      onMembersPress();
    });
  }, [closeMenu, onMembersPress]);

  const renderExpenseItem = useCallback<ListRenderItem<GroupExpenseFeedItem>>(
    ({ item }) => <GroupExpenseFeedRow groupId={group.id} item={item} t={t} />,
    [group.id, t],
  );

  const expenseKeyExtractor = useCallback((item: GroupExpenseFeedItem) => item.id, []);

  const ExpenseSeparator = useCallback(function ExpenseSeparator(): ReactElement {
    return <View style={{ height: space.gapMd }} />;
  }, []);

  const hubHeaderElement = useMemo(
    () => (
      <View style={styles.hubHeaderStack}>
        <View style={{ alignSelf: 'stretch' }}>
          {(() => {
            const topRow = (
              <View style={styles.topRow}>
                <BackHeaderButton onPress={onBack} accessibilityLabel={t('createGroup.backA11y')} />
                <View ref={overflowAnchorRef} collapsable={false} style={styles.overflowHit}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('groups.detail.overflowMenuA11y')}
                    accessibilityHint={t('groups.detail.overflowMenuHint')}
                    accessibilityState={{ disabled: isDeleting, busy: isDeleting }}
                    disabled={isDeleting}
                    hitSlop={12}
                    onPress={openOverflowMenu}
                    style={({ pressed }) => [
                      styles.overflowPressableFill,
                      { opacity: pressed && !isDeleting ? 0.65 : isDeleting ? 0.45 : 1 },
                    ]}
                  >
                    <Ionicons name="ellipsis-horizontal" size={22} color={palette.textPrimary} />
                  </Pressable>
                </View>
              </View>
            );
            const chromeStyle = [
              styles.hubNavBarBlur,
              {
                marginHorizontal: -space.screenPaddingLg,
                paddingHorizontal: space.screenPaddingLg,
                borderBottomColor: palette.groupHubBorder,
              },
            ];
            if (Platform.OS === 'web') {
              return (
                <View style={[...chromeStyle, { backgroundColor: palette.glassStrong }]}>
                  {topRow}
                </View>
              );
            }
            return (
              <BlurView
                intensity={themeMode === 'dark' ? 28 : 22}
                tint={themeMode === 'dark' ? 'dark' : 'light'}
                experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                style={chromeStyle}
              >
                {topRow}
              </BlurView>
            );
          })()}

          <View style={styles.hero}>
            <View style={styles.heroAvatarBlock}>
              <View style={styles.heroIconCluster}>
                <LinearGradient
                  pointerEvents="none"
                  colors={[palette.surfaceElevated, palette.groupHubAccentSoft]}
                  start={{ x: 0.15, y: 0.1 }}
                  end={{ x: 0.92, y: 0.9 }}
                  style={styles.heroIconGradient}
                />
                {group.avatar ? (
                  <View
                    style={[
                      styles.heroAvatarRing,
                      platformShadow('xs'),
                      {
                        zIndex: 1,
                        borderColor: palette.groupHubBorder,
                        backgroundColor: palette.groupHubCard,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: group.avatar }}
                      style={styles.heroAvatarImage}
                      contentFit="cover"
                      accessibilityIgnoresInvertColors
                    />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.heroAvatarFallback,
                      platformShadow('xs'),
                      {
                        zIndex: 1,
                        borderColor: palette.groupHubBorder,
                        backgroundColor: palette.groupHubCard,
                      },
                    ]}
                    accessibilityRole="image"
                    accessibilityLabel={typeEmoji}
                  >
                    <Text style={[styles.heroEmoji, { color: palette.textPrimary }]}>
                      {typeEmoji}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.heroTitleBlock}>
              <View
                style={styles.heroTitleRow}
                accessibilityRole="header"
                accessibilityLabel={`${typeEmoji} ${group.name}`}
              >
                {group.avatar ? (
                  <>
                    <Text style={[styles.heroTitleEmoji, { color: palette.textPrimary }]}>
                      {typeEmoji}
                    </Text>
                    <Text style={[styles.heroTitleName, { color: palette.textPrimary }]}>
                      {group.name}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.heroTitleName, { color: palette.textPrimary }]}>
                    {group.name}
                  </Text>
                )}
              </View>
            </View>
            {heroMemberRowModel ? (
              <View style={styles.heroFirstMetaBlock}>
                <View style={styles.heroMemberRowWrap}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('groups.detail.hubHeroMemberRowA11y', {
                      count: heroMemberRowModel.total,
                    })}
                    accessibilityHint={t('groups.detail.hubHeroMemberRowHint')}
                    disabled={isDeleting}
                    onPress={onMembersPress}
                    style={({ pressed }) => [
                      styles.heroMemberRowInner,
                      { opacity: isDeleting ? 0.45 : pressed ? 0.72 : 1 },
                    ]}
                  >
                    <View style={styles.heroMemberFaceStack} accessible={false}>
                      {heroMemberRowModel.mode === 'placeholder'
                        ? Array.from({ length: heroMemberRowModel.placeholders }, (_, i) => (
                            <View
                              key={`hero-mem-ph-${i}`}
                              accessible={false}
                              style={[
                                styles.heroMemberFace,
                                i > 0 ? styles.heroMemberFaceOverlap : null,
                                {
                                  borderColor: palette.groupHubBorder,
                                  backgroundColor: palette.groupHubCard,
                                },
                              ]}
                            >
                              <Ionicons name="person-outline" size={20} color={palette.textMuted} />
                            </View>
                          ))
                        : heroMemberRowModel.faces.map((m, i) => {
                            const label = (m.name ?? m.username ?? '?').trim() || '?';
                            const initial = label.slice(0, 1).toUpperCase();
                            return m.avatar ? (
                              <Image
                                key={m.id}
                                accessible={false}
                                source={{ uri: m.avatar }}
                                style={[
                                  styles.heroMemberFace,
                                  i > 0 ? styles.heroMemberFaceOverlap : null,
                                  {
                                    borderColor: palette.groupHubBorder,
                                    backgroundColor: palette.groupHubCard,
                                  },
                                ]}
                                contentFit="cover"
                                accessibilityIgnoresInvertColors
                              />
                            ) : (
                              <View
                                key={m.id}
                                accessible={false}
                                style={[
                                  styles.heroMemberFace,
                                  i > 0 ? styles.heroMemberFaceOverlap : null,
                                  {
                                    borderColor: palette.groupHubBorder,
                                    backgroundColor: palette.surfaceElevated,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.heroMemberFaceFallbackLetter,
                                    { color: palette.textPrimary },
                                  ]}
                                >
                                  {initial}
                                </Text>
                              </View>
                            );
                          })}
                    </View>
                    {heroMemberRowModel.overflow > 0 ? (
                      <Text
                        accessible={false}
                        style={[styles.heroMemberOverflowMono, { color: palette.groupHubMuted }]}
                        numberOfLines={1}
                      >
                        {t('groups.detail.hubHeroMembersOverflow', {
                          count: heroMemberRowModel.overflow,
                        })}
                      </Text>
                    ) : null}
                  </Pressable>
                </View>
              </View>
            ) : null}
            <Text
              style={[
                styles.hubMemberLine,
                styles.heroSubtitleLine,
                { color: palette.groupHubMuted },
              ]}
            >
              {heroMetaLine}
            </Text>
          </View>
        </View>

        {!fetchMembersRoster && offlineInvite ? (
          <Text
            style={[textStyles.caption, { color: palette.warningText, alignSelf: 'stretch' }]}
            accessibilityLiveRegion="polite"
          >
            {t('invites.offlineBanner')}
          </Text>
        ) : null}

        {!fetchMembersRoster ? (
          <View style={{ marginTop: space.gapLg, alignSelf: 'stretch' }}>
            <GroupHubBalanceSummaryCard
              variant="preview"
              eyebrow={t('groups.detail.hubBalanceKicker')}
              primaryText={balanceCard.label}
              settleCtaLabel={t('groups.detail.hubSettleUpCta')}
              settleCtaA11y={t('groups.detail.hubSettleUpCtaA11y')}
            />
          </View>
        ) : (
          <View style={[styles.hubSectionStack, { marginTop: space.gapLg }]}>
            {balanceHeroModel ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('groups.detail.balanceScreenOpenA11y')}
                accessibilityHint={t('groups.detail.balanceScreenOpenHint')}
                disabled={isDeleting}
                onPress={onOpenBalancesScreen}
                style={({ pressed }) => [
                  { alignSelf: 'stretch', opacity: isDeleting ? 0.45 : pressed ? 0.94 : 1 },
                ]}
              >
                <GroupHubBalanceSummaryCard
                  variant={balanceHeroModel.variant === 'settled' ? 'settled' : 'active'}
                  tone={
                    balanceHeroModel.variant === 'active' &&
                    (balanceHeroModel.tone === 'owed_to_you' || balanceHeroModel.tone === 'you_owe')
                      ? balanceHeroModel.tone
                      : undefined
                  }
                  eyebrow={balanceHeroModel.eyebrow}
                  primaryText={balanceHeroModel.amountStr}
                  activeBalanceFootline={balanceHeroModel.activeBalanceFootline}
                  showSettleCta={balanceHeroModel.variant === 'active'}
                  onSettlePress={onSettleSoon}
                  settleDisabled={isDeleting}
                  settleCtaLabel={t('groups.detail.hubSettleUpCta')}
                  settleCtaA11y={t('groups.detail.hubSettleUpCtaA11y')}
                />
              </Pressable>
            ) : null}

            <View style={[styles.sectionRule, { backgroundColor: palette.groupHubBorder }]} />
            <View style={{ alignSelf: 'stretch', gap: space.gapMd }}>
              <Text style={[styles.sectionKicker, { color: palette.groupHubMuted }]}>
                {t('groups.detail.hubMembersSection')}
              </Text>
              <View style={[styles.memberStripRow, { justifyContent: 'space-between' }]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.memberStripScroll}
                    contentContainerStyle={{ alignItems: 'center', gap: space.gapSm }}
                  >
                    {activeMembersStrip.slice(0, 8).map((m) => {
                      const label = (m.name ?? m.username ?? '?').trim() || '?';
                      const initial = label.slice(0, 1).toUpperCase();
                      return m.avatar ? (
                        <Image
                          key={m.id}
                          source={{ uri: m.avatar }}
                          style={[
                            styles.memberStripAvatar,
                            {
                              borderColor: palette.groupHubBorder,
                              backgroundColor: palette.groupHubCard,
                            },
                          ]}
                          contentFit="cover"
                          accessibilityIgnoresInvertColors
                          accessibilityRole="image"
                          accessibilityLabel={label}
                        />
                      ) : (
                        <View
                          key={m.id}
                          style={[
                            styles.memberStripAvatar,
                            {
                              borderColor: palette.groupHubBorder,
                              backgroundColor: palette.surfaceElevated,
                            },
                          ]}
                          accessibilityRole="none"
                          accessible
                          accessibilityLabel={label}
                        >
                          <Text
                            style={[
                              styles.memberStripFallbackLetter,
                              { color: palette.textPrimary },
                            ]}
                          >
                            {initial}
                          </Text>
                        </View>
                      );
                    })}
                    {activeMembersStrip.length > 8 ? (
                      <View
                        style={[
                          styles.memberStripAvatar,
                          {
                            borderColor: palette.groupHubBorder,
                            backgroundColor: palette.groupHubCard,
                          },
                        ]}
                        accessibilityRole="text"
                        accessibilityLabel={t('groups.detail.hubMembersMoreA11y', {
                          count: activeMembersStrip.length - 8,
                        })}
                      >
                        <Text
                          style={[styles.memberStripAvatarMore, { color: palette.textSecondary }]}
                        >
                          +{activeMembersStrip.length - 8}
                        </Text>
                      </View>
                    ) : null}
                  </ScrollView>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('groups.detail.hubViewMembersCtaA11y')}
                  accessibilityHint={t('groups.detail.memberStripChevronHint')}
                  onPress={onMembersPress}
                  disabled={isDeleting}
                  style={({ pressed }) => [
                    styles.memberStripChevronHit,
                    { opacity: isDeleting ? 0.45 : pressed ? 0.72 : 1 },
                  ]}
                >
                  <Ionicons name="chevron-forward" size={22} color={palette.textPrimary} />
                </Pressable>
              </View>
              {canAddMembers ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('groups.detail.hubInviteCtaA11y')}
                  disabled={isDeleting}
                  onPress={onPrimaryCtaPress}
                  style={({ pressed }) => [{ opacity: isDeleting ? 0.45 : pressed ? 0.72 : 1 }]}
                >
                  <Text style={[styles.hubPeopleLink, { color: palette.groupHubAccent }]}>
                    {t('groups.detail.hubInviteCta')}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <View style={[styles.sectionRule, { backgroundColor: palette.groupHubBorder }]} />
            <View style={{ alignSelf: 'stretch', gap: space.gapMd }}>
              <Text style={[styles.sectionKicker, { color: palette.groupHubMuted }]}>
                {t('groups.detail.hubQuickActionsKicker')}
              </Text>
              <View style={styles.quickActionsRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('groups.detail.hubQuickExpenseA11y')}
                  onPress={onOpenAddExpense}
                  disabled={isDeleting}
                  style={({ pressed }) => [
                    styles.quickActionPill,
                    platformShadow('sm'),
                    {
                      borderColor: palette.border,
                      backgroundColor: palette.groupHubCard,
                      opacity: isDeleting ? 0.45 : pressed ? 0.88 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.quickActionLabel, { color: palette.textPrimary }]}>
                    {t('groups.detail.hubQuickExpenseTile')}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('groups.detail.hubQuickSettleA11y')}
                  onPress={onSettleSoon}
                  disabled={isDeleting}
                  style={({ pressed }) => [
                    styles.quickActionPill,
                    platformShadow('sm'),
                    {
                      borderColor: palette.border,
                      backgroundColor: palette.groupHubCard,
                      opacity: isDeleting ? 0.45 : pressed ? 0.88 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.quickActionLabel, { color: palette.textPrimary }]}>
                    {t('groups.detail.hubQuickSettleTile')}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('groups.detail.hubQuickNotesA11y')}
                  onPress={onNotesSoon}
                  disabled={isDeleting}
                  style={({ pressed }) => [
                    styles.quickActionPill,
                    platformShadow('sm'),
                    {
                      borderColor: palette.border,
                      backgroundColor: palette.groupHubCard,
                      opacity: isDeleting ? 0.45 : pressed ? 0.88 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.quickActionLabel, { color: palette.textPrimary }]}>
                    {t('groups.detail.hubQuickNotesTile')}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('groups.detail.hubQuickAnalyticsA11y')}
                  onPress={onOpenAnalyticsScreen}
                  disabled={isDeleting}
                  style={({ pressed }) => [
                    styles.quickActionPill,
                    platformShadow('sm'),
                    {
                      borderColor: palette.border,
                      backgroundColor: palette.groupHubCard,
                      opacity: isDeleting ? 0.45 : pressed ? 0.88 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.quickActionLabel, { color: palette.textPrimary }]}>
                    {t('groups.detail.hubQuickAnalyticsTile')}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('groups.detail.hubQuickTimelineA11y')}
                  onPress={onOpenGroupTimeline}
                  disabled={isDeleting}
                  style={({ pressed }) => [
                    styles.quickActionPill,
                    platformShadow('sm'),
                    {
                      borderColor: palette.border,
                      backgroundColor: palette.groupHubCard,
                      opacity: isDeleting ? 0.45 : pressed ? 0.88 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.quickActionLabel, { color: palette.textPrimary }]}>
                    {t('groups.detail.hubQuickTimelineTile')}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.sectionRule, { backgroundColor: palette.groupHubBorder }]} />
            <View style={{ alignSelf: 'stretch', gap: space.gapMd }}>
              <Text style={[styles.sectionKicker, { color: palette.groupHubMuted }]}>
                {t('groups.detail.hubReceiptsSection')}
              </Text>
              {expenseFeed.isError ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('groups.detail.hubExpensesRetry')}
                  onPress={onExpenseFeedRetry}
                  style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }]}
                >
                  <Text style={[styles.emptyHint, { color: palette.errorText }]}>
                    {t('groups.detail.hubExpensesLoadError')}
                  </Text>
                  <Text
                    style={[
                      styles.emptyHint,
                      { color: palette.groupHubAccent, marginTop: space.gapSm },
                    ]}
                  >
                    {t('groups.detail.hubExpensesRetry')}
                  </Text>
                </Pressable>
              ) : expenseFeed.isPending && expenseItems.length === 0 ? (
                <ActivityIndicator style={{ alignSelf: 'flex-start' }} color={palette.accent} />
              ) : expenseItems.length === 0 ? (
                <View
                  style={styles.hubExpensesEmptyBlock}
                  accessibilityRole="text"
                  accessibilityLabel={t('groups.detail.hubExpensesEmptyA11y')}
                >
                  <Text style={[styles.hubExpensesEmptyTitle, { color: palette.textPrimary }]}>
                    {t('groups.detail.hubExpensesEmptyTitle')}
                  </Text>
                  <Text style={[styles.hubExpensesEmptyBody, { color: palette.textSecondary }]}>
                    {t('groups.detail.hubExpensesEmptyBody')}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {fetchMembersRoster ? null : (
          <View style={{ gap: space.gapMd, alignSelf: 'stretch', marginTop: space.gapLg }}>
            <View style={{ flexDirection: 'row', gap: space.gapMd }}>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('groups.membersScreen.declineInvite')}
                  variant="secondary"
                  onPress={confirmDeclineInviteHub}
                  disabled={offlineInvite || isDeleting || inviteActionBusy}
                  loading={declineInviteMutation.isPending}
                  trailing="none"
                  labelCase="none"
                  accessibilityLabel={t('groups.membersScreen.declineInviteA11y')}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('groups.membersScreen.acceptInvite')}
                  variant="accent"
                  onPress={runAcceptInviteHub}
                  disabled={offlineInvite || isDeleting || inviteActionBusy}
                  loading={acceptInviteMutation.isPending}
                  trailing="none"
                  labelCase="none"
                  accessibilityLabel={t('groups.membersScreen.acceptInviteA11y')}
                />
              </View>
            </View>
          </View>
        )}
      </View>
    ),
    [
      acceptInviteMutation.isPending,
      activeMembersStrip,
      balanceCard.label,
      balanceHeroModel,
      canAddMembers,
      confirmDeclineInviteHub,
      declineInviteMutation.isPending,
      expenseFeed.isError,
      expenseFeed.isPending,
      expenseItems,
      fetchMembersRoster,
      group.avatar,
      group.name,
      heroMemberRowModel,
      heroMetaLine,
      inviteActionBusy,
      isDeleting,
      offlineInvite,
      onBack,
      onExpenseFeedRetry,
      onMembersPress,
      onNotesSoon,
      onOpenAddExpense,
      onOpenGroupTimeline,
      onPrimaryCtaPress,
      onOpenAnalyticsScreen,
      onOpenBalancesScreen,
      onSettleSoon,
      openOverflowMenu,
      overflowAnchorRef,
      palette.accent,
      palette.border,
      palette.errorText,
      palette.glassStrong,
      palette.groupHubAccent,
      palette.groupHubAccentSoft,
      palette.groupHubBorder,
      palette.groupHubCard,
      palette.groupHubMuted,
      palette.overlayStrong,
      palette.surfaceElevated,
      palette.textMuted,
      palette.textOnAccent,
      palette.textPrimary,
      palette.textSecondary,
      palette.warningText,
      runAcceptInviteHub,
      t,
      themeMode,
      typeEmoji,
    ],
  );

  const expenseListFooter = useMemo((): ReactElement | null => {
    if (!fetchMembersRoster || !expenseFeed.isFetchingNextPage) {
      return null;
    }
    return <ActivityIndicator style={{ marginVertical: space.gapMd }} color={palette.accent} />;
  }, [expenseFeed.isFetchingNextPage, fetchMembersRoster, palette.accent]);

  const detailMetaCard = (
    <View
      style={[
        styles.metaCard,
        platformShadow('sm'),
        { borderColor: palette.groupHubBorder, backgroundColor: palette.groupHubCard },
      ]}
    >
      <Text style={[styles.metaLabel, { color: palette.groupHubMuted }]}>
        {t('groups.detail.typeLabel')}
      </Text>
      <Text style={[styles.metaValue, { color: palette.textPrimary }]}>{typeLabel}</Text>
      <View style={[styles.hairline, { backgroundColor: palette.groupHubBorder }]} />
      <Text style={[styles.metaLabel, { color: palette.groupHubMuted }]}>
        {t('groups.detail.updatedLabel')}
      </Text>
      <Text style={[styles.metaValueMono, { color: palette.textSecondary }]}>
        {formatDate(group.updatedAt)}
      </Text>
      <View style={[styles.hairline, { backgroundColor: palette.groupHubBorder }]} />
      <Text style={[styles.metaLabel, { color: palette.groupHubMuted }]}>
        {t('groups.detail.createdLabel')}
      </Text>
      <Text style={[styles.metaValueMono, { color: palette.textSecondary }]}>
        {formatDate(group.createdAt)}
      </Text>
    </View>
  );

  const expenseFabSurface = palette.accent;
  const expenseFabBorder = palette.accent;
  const expenseFabInk = palette.textOnAccent;

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: palette.groupHubBackground }]}
    >
      <View style={[styles.mainColumn, { backgroundColor: palette.groupHubBackground }]}>
        <FlashList<GroupExpenseFeedItem>
          data={fetchMembersRoster ? expenseItems : []}
          keyExtractor={expenseKeyExtractor}
          renderItem={renderExpenseItem}
          ListHeaderComponent={() => hubHeaderElement}
          ListFooterComponent={expenseListFooter}
          ItemSeparatorComponent={ExpenseSeparator}
          onEndReached={() => {
            if (!fetchMembersRoster) {
              return;
            }
            if (!expenseFeed.hasNextPage || expenseFeed.isFetchingNextPage) {
              return;
            }
            void expenseFeed.fetchNextPage();
          }}
          onEndReachedThreshold={0.35}
          refreshControl={
            fetchMembersRoster ? (
              <RefreshControl
                refreshing={balancesQuery.isRefetching || expenseFeed.isRefetching}
                onRefresh={onHubRefresh}
                tintColor={palette.accent}
                colors={[palette.accent]}
              />
            ) : undefined
          }
          contentContainerStyle={StyleSheet.flatten([
            styles.scroll,
            {
              paddingHorizontal: space.screenPaddingLg,
              paddingBottom: hubScrollBottomPadding,
            },
          ])}
          style={StyleSheet.flatten([
            styles.mainColumn,
            { backgroundColor: palette.groupHubBackground },
          ])}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>

      {fetchMembersRoster && !isDeleting ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.expenseFabAnchor,
            {
              paddingBottom: expenseFabBottomOffset,
              paddingEnd: space.screenPaddingLg,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('groups.detail.expenseFabA11y')}
            accessibilityHint={t('groups.detail.expenseFabHint')}
            hitSlop={8}
            onPress={onOpenAddExpense}
            style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
          >
            <View
              style={[
                styles.expenseFab,
                platformShadow('sm'),
                {
                  borderColor: expenseFabBorder,
                  backgroundColor: expenseFabSurface,
                },
              ]}
            >
              <Ionicons
                name="add"
                size={22}
                color={expenseFabInk}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <Text style={[styles.expenseFabLabel, { color: expenseFabInk }]} numberOfLines={1}>
                {t('groups.detail.hubAddExpenseFab')}
              </Text>
            </View>
          </Pressable>
        </View>
      ) : null}

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <View style={styles.modalRoot} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('groups.detail.overflowCloseBackdropA11y')}
            onPress={closeMenu}
            style={[styles.menuBackdrop, { backgroundColor: palette.scrim }]}
          />
          {menuPos ? (
            <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
              <View
                accessibilityRole="menu"
                style={[
                  styles.menuCard,
                  platformShadow('md'),
                  {
                    top: menuPos.top,
                    left: menuPos.left,
                    width: OVERFLOW_MENU_WIDTH,
                    borderColor: palette.groupHubBorder,
                    backgroundColor: palette.groupHubCard,
                  },
                ]}
              >
                <Pressable
                  accessibilityRole="menuitem"
                  accessibilityLabel={t('groups.detail.detailsRowA11y')}
                  accessibilityHint={t('groups.detail.detailsRowHint')}
                  disabled={isDeleting}
                  onPress={onAboutRowPress}
                  style={({ pressed }) => [
                    styles.menuRowPressable,
                    { backgroundColor: pressed ? palette.groupHubAccentSoft : 'transparent' },
                  ]}
                >
                  <View style={styles.menuRow}>
                    <Ionicons
                      name="information-circle-outline"
                      size={22}
                      color={palette.textPrimary}
                    />
                    <Text
                      style={[styles.menuRowLabel, { color: palette.textPrimary }]}
                      numberOfLines={1}
                    >
                      {t('groups.detail.detailsRowLabel')}
                    </Text>
                  </View>
                </Pressable>
                {fetchMembersRoster ? (
                  <>
                    <View
                      style={[styles.menuDivider, { backgroundColor: palette.groupHubBorder }]}
                    />
                    <Pressable
                      accessibilityRole="menuitem"
                      accessibilityLabel={t('groups.detail.hubViewMembersCtaA11y')}
                      accessibilityHint={t('groups.detail.overflowMembersRowHint')}
                      disabled={isDeleting}
                      onPress={onOverflowMembersPress}
                      style={({ pressed }) => [
                        styles.menuRowPressable,
                        { backgroundColor: pressed ? palette.groupHubAccentSoft : 'transparent' },
                      ]}
                    >
                      <View style={styles.menuRow}>
                        <Ionicons name="people-outline" size={22} color={palette.textPrimary} />
                        <Text
                          style={[styles.menuRowLabel, { color: palette.textPrimary }]}
                          numberOfLines={1}
                        >
                          {t('groups.detail.hubViewMembersCta')}
                        </Text>
                      </View>
                    </Pressable>
                  </>
                ) : null}
                {canDeleteGroup ? (
                  <>
                    <View
                      style={[styles.menuDivider, { backgroundColor: palette.groupHubBorder }]}
                    />
                    <Pressable
                      accessibilityRole="menuitem"
                      accessibilityLabel={t('groups.detail.deleteGroupRowA11y')}
                      accessibilityHint={t('groups.detail.deleteGroupRowHint')}
                      disabled={isDeleting}
                      onPress={onDeleteRowPress}
                      style={({ pressed }) => [
                        styles.menuRowPressable,
                        { backgroundColor: pressed ? palette.groupHubAccentSoft : 'transparent' },
                      ]}
                    >
                      <View style={styles.menuRow}>
                        <Ionicons name="trash-outline" size={22} color={palette.errorText} />
                        <Text
                          style={[styles.menuRowLabel, { color: palette.errorText }]}
                          numberOfLines={1}
                        >
                          {t('groups.detail.deleteGroupRowA11y')}
                        </Text>
                      </View>
                    </Pressable>
                  </>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
      <Modal
        visible={aboutOpen}
        transparent
        animationType="fade"
        onRequestClose={closeAbout}
        statusBarTranslucent
      >
        <View style={styles.modalRoot} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('groups.detail.aboutCloseBackdropA11y')}
            onPress={closeAbout}
            style={[styles.menuBackdrop, { backgroundColor: palette.scrim }]}
          />
          <View style={styles.aboutCenterWrap} pointerEvents="box-none">
            <View style={styles.aboutInner} pointerEvents="auto">
              <Text
                style={[styles.aboutHeading, { color: palette.textPrimary }]}
                accessibilityRole="header"
              >
                {t('groups.detail.aboutTitle')}
              </Text>
              {detailMetaCard}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
