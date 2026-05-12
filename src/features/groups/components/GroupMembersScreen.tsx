import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import type { TFunction } from 'i18next';
import { useCallback, useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
  type AlertButton,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api';
import { BackHeaderButton, Button } from '@/components/ui';
import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
import { GroupMemberRow } from '@/features/groups/components/GroupMemberRow';
import { groupMembersScreenStyles as styles } from '@/features/groups/components/groupMembersScreen.styles';
import { GROUP_TYPE_EMOJI } from '@/features/groups/constants/groupTypes';
import {
  useAcceptGroupInvite,
  useDeclineGroupInvite,
  useGroupMembers,
  useRemoveGroupMember,
  useUpdateGroupMemberRole,
} from '@/features/groups/hooks/useGroupMembers';
import { useGroupDetail } from '@/features/groups/hooks/useGroupDetail';
import type {
  GroupMemberRosterEntry,
  GroupMemberRole,
} from '@/features/groups/types/groupMember.types';
import {
  canShowOwnerRoleControl,
  canShowRemoveMemberControl,
  canShowSelfInviteActions,
  findActorRole,
} from '@/features/groups/utils/memberRosterPermissions';
import { useGroupInvitesInbox } from '@/features/invites/hooks/useGroupInvitesInbox';
import { platformShadow, radius, space, textStyles, useThemeColors } from '@/theme';

export type GroupMembersScreenProps = {
  groupId: string;
  onBack: () => void;
};

function displayNameForMember(m: GroupMemberRosterEntry, t: (k: string) => string): string {
  const name = m.name?.trim();
  if (name) return name;
  const user = m.username?.trim();
  if (user) return `@${user}`;
  return t('groups.membersScreen.anonymousMember');
}

/**
 * Member list and admin actions. Roster from {@link useGroupMembers} (`GET /v1/groups/:groupId/members`).
 */
export function GroupMembersScreen({ groupId, onBack }: GroupMembersScreenProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    data: group,
    isPending: groupPending,
    isError: groupIsError,
    error: groupError,
    refetch: refetchGroup,
  } = useGroupDetail(groupId);
  const { data: me } = useAuthMe();
  const {
    data: roster = [],
    isPending: rosterPending,
    isError,
    error: rosterError,
    refetch,
  } = useGroupMembers(groupId);
  const { data: inboxList, isPending: inboxPending } = useGroupInvitesInbox();
  const pendingInviteForGroup = useMemo(
    () => inboxList?.find((i) => i.groupId === groupId),
    [inboxList, groupId],
  );
  const removeMutation = useRemoveGroupMember(groupId);
  const acceptInviteMutation = useAcceptGroupInvite(groupId);
  const declineInviteMutation = useDeclineGroupInvite(groupId);
  const updateRoleMutation = useUpdateGroupMemberRole(groupId);

  useFocusEffect(
    useCallback(() => {
      void refetch();
      void refetchGroup();
    }, [refetch, refetchGroup]),
  );

  const currentUserId = me?.id;

  const actorRole = useMemo(() => findActorRole(roster, currentUserId), [roster, currentUserId]);

  const isGroupCreator = useMemo(
    () =>
      Boolean(group?.createdByUserId && currentUserId && group.createdByUserId === currentUserId),
    [group?.createdByUserId, currentUserId],
  );

  const actorRoleForPermissions = useMemo((): GroupMemberRole | null => {
    if (actorRole) return actorRole;
    if (isGroupCreator) return 'owner';
    return null;
  }, [actorRole, isGroupCreator]);

  const canAddMembers = actorRole === 'owner' || actorRole === 'admin' || isGroupCreator;

  const openAdd = useCallback(() => {
    if (!canAddMembers) return;
    void Haptics.selectionAsync().catch(() => {});
    router.push(`/home/group/${groupId}/add-members`);
  }, [canAddMembers, groupId, router]);

  const onRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const onRetryGroup = useCallback(() => {
    void refetchGroup();
  }, [refetchGroup]);

  const confirmRemove = useCallback(
    (member: GroupMemberRosterEntry) => {
      const label = displayNameForMember(member, t);
      Alert.alert(
        t('groups.membersScreen.removeConfirmTitle'),
        t('groups.membersScreen.removeConfirmMessage', { name: label }),
        [
          { text: t('groups.membersScreen.removeConfirmCancel'), style: 'cancel' },
          {
            text: t('groups.membersScreen.removeConfirmCta'),
            style: 'destructive',
            onPress: () => {
              void removeMutation.mutateAsync(member.id).catch((e) => {
                const msg =
                  e instanceof ApiError
                    ? mapRemoveMemberErrorMessage(e, t as TFunction)
                    : t('groups.membersScreen.removeErrorGeneric');
                Alert.alert(t('groups.membersScreen.removeErrorTitle'), msg);
              });
            },
          },
        ],
      );
    },
    [removeMutation, t],
  );

  const runAcceptInvite = useCallback(() => {
    void acceptInviteMutation
      .mutateAsync()
      .then(() => void refetch())
      .catch((e) => {
        const msg =
          e instanceof ApiError
            ? mapInviteFlowError(e, t as TFunction)
            : t('groups.membersScreen.inviteAcceptErrorGeneric');
        Alert.alert(t('groups.membersScreen.inviteAcceptErrorTitle'), msg);
      });
  }, [acceptInviteMutation, refetch, t]);

  const confirmDeclineInvite = useCallback(() => {
    Alert.alert(
      t('groups.membersScreen.declineInviteConfirmTitle'),
      t('groups.membersScreen.declineInviteConfirmBody'),
      [
        { text: t('groups.membersScreen.declineInviteConfirmCancel'), style: 'cancel' },
        {
          text: t('groups.membersScreen.declineInviteConfirmCta'),
          style: 'destructive',
          onPress: () => {
            void declineInviteMutation
              .mutateAsync()
              .then(() => void refetch())
              .catch((e) => {
                const msg =
                  e instanceof ApiError
                    ? mapInviteFlowError(e, t as TFunction)
                    : t('groups.membersScreen.inviteDeclineErrorGeneric');
                Alert.alert(t('groups.membersScreen.inviteDeclineErrorTitle'), msg);
              });
          },
        },
      ],
    );
  }, [declineInviteMutation, refetch, t]);

  const confirmDeclineInviteLeaveScreen = useCallback(() => {
    Alert.alert(
      t('groups.membersScreen.declineInviteConfirmTitle'),
      t('groups.membersScreen.declineInviteConfirmBody'),
      [
        { text: t('groups.membersScreen.declineInviteConfirmCancel'), style: 'cancel' },
        {
          text: t('groups.membersScreen.declineInviteConfirmCta'),
          style: 'destructive',
          onPress: () => {
            void declineInviteMutation
              .mutateAsync()
              .then(onBack)
              .catch((e) => {
                const msg =
                  e instanceof ApiError
                    ? mapInviteFlowError(e, t as TFunction)
                    : t('groups.membersScreen.inviteDeclineErrorGeneric');
                Alert.alert(t('groups.membersScreen.inviteDeclineErrorTitle'), msg);
              });
          },
        },
      ],
    );
  }, [declineInviteMutation, onBack, t]);

  const openRoleChange = useCallback(
    (member: GroupMemberRosterEntry) => {
      const label = displayNameForMember(member, t);
      const buttons: AlertButton[] = [];
      if (member.role === 'member') {
        buttons.push({
          text: t('groups.membersScreen.promoteToAdmin'),
          onPress: () => {
            void updateRoleMutation
              .mutateAsync({ memberId: member.id, body: { role: 'admin' } })
              .catch((e) => {
                const msg =
                  e instanceof ApiError
                    ? mapRoleChangeError(e, t as TFunction)
                    : t('groups.membersScreen.roleChangeErrorGeneric');
                Alert.alert(t('groups.membersScreen.roleChangeErrorTitle'), msg);
              });
          },
        });
      } else if (member.role === 'admin') {
        buttons.push({
          text: t('groups.membersScreen.demoteToMember'),
          onPress: () => {
            void updateRoleMutation
              .mutateAsync({ memberId: member.id, body: { role: 'member' } })
              .catch((e) => {
                const msg =
                  e instanceof ApiError
                    ? mapRoleChangeError(e, t as TFunction)
                    : t('groups.membersScreen.roleChangeErrorGeneric');
                Alert.alert(t('groups.membersScreen.roleChangeErrorTitle'), msg);
              });
          },
        });
      }
      buttons.push({
        text: t('groups.membersScreen.roleChangeCancel'),
        style: 'cancel',
      });
      Alert.alert(
        t('groups.membersScreen.roleChangeTitle'),
        t('groups.membersScreen.roleChangeMessage', { name: label }),
        buttons,
      );
    },
    [t, updateRoleMutation],
  );

  const renderItem: ListRenderItem<GroupMemberRosterEntry> = useCallback(
    ({ item }) => {
      const label = displayNameForMember(item, t);
      const showRemove = canShowRemoveMemberControl({
        actorUserId: currentUserId,
        actorRole: actorRoleForPermissions,
        target: item,
      });
      const showSelfInvite = canShowSelfInviteActions({
        actorUserId: currentUserId,
        target: item,
      });
      const showOwnerRole = canShowOwnerRoleControl({
        actorRole: actorRoleForPermissions,
        target: item,
      });
      const inviteBusy = acceptInviteMutation.isPending || declineInviteMutation.isPending;
      return (
        <GroupMemberRow
          member={item}
          displayName={label}
          showRemove={showRemove}
          isRemoving={removeMutation.isPending}
          onRemovePress={() => confirmRemove(item)}
          showSelfInviteActions={showSelfInvite}
          onAcceptInvitePress={runAcceptInvite}
          onDeclineInvitePress={confirmDeclineInvite}
          inviteActionBusy={inviteBusy}
          showOwnerRoleControl={showOwnerRole}
          onRoleControlPress={() => openRoleChange(item)}
          roleActionBusy={updateRoleMutation.isPending}
        />
      );
    },
    [
      actorRoleForPermissions,
      acceptInviteMutation.isPending,
      confirmDeclineInvite,
      confirmRemove,
      currentUserId,
      declineInviteMutation.isPending,
      openRoleChange,
      removeMutation.isPending,
      runAcceptInvite,
      t,
      updateRoleMutation.isPending,
    ],
  );

  const keyExtractor = useCallback((item: GroupMemberRosterEntry) => item.id, []);

  const groupNotFound = useMemo(() => {
    if (!groupIsError || !groupError) return false;
    if (!(groupError instanceof ApiError)) return false;
    return groupError.code === 'GROUP_NOT_FOUND' || groupError.status === 404;
  }, [groupError, groupIsError]);

  const notGroupMember = useMemo(() => {
    if (!isError || !rosterError) return false;
    if (!(rosterError instanceof ApiError)) return false;
    return rosterError.code === 'NOT_GROUP_MEMBER';
  }, [isError, rosterError]);

  const listHeader = useMemo(() => {
    const rosterErrMsg = mapRosterLoadMessage(isError ? rosterError : undefined, t as TFunction);
    const emoji = group ? GROUP_TYPE_EMOJI[group.type] : '·';
    const name = group?.name ?? '';
    const avatarUrl = group?.avatar ?? null;
    return (
      <View>
        <View style={styles.topRow}>
          <BackHeaderButton onPress={onBack} accessibilityLabel={t('createGroup.backA11y')} />
          {canAddMembers && !groupNotFound ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('groups.membersScreen.addFabA11y')}
              accessibilityHint={t('groups.membersScreen.addFabHint')}
              onPress={openAdd}
              hitSlop={12}
              style={({ pressed }) => [styles.headerAddHit, { opacity: pressed ? 0.65 : 1 }]}
            >
              <Ionicons name="person-add-outline" size={24} color={palette.iconPrimary} />
            </Pressable>
          ) : (
            <View style={styles.headerAddPlaceholder} />
          )}
        </View>
        <View style={styles.headerBlock}>
          <View
            style={[
              styles.headerAvatarRing,
              { borderColor: palette.borderSubtle, backgroundColor: palette.surfaceRaised },
            ]}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={[styles.headerAvatarImg, { borderRadius: radius.full }]}
                contentFit="cover"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <Text style={[styles.headerGlyph, { color: palette.textPrimary }]}>{emoji}</Text>
            )}
          </View>
          <View style={styles.headerTitles}>
            <Text
              style={[styles.title, { color: palette.textPrimary }]}
              numberOfLines={2}
              accessibilityRole="header"
            >
              {groupPending && !group ? '…' : name}
            </Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              {t('groups.members', { count: roster.length })}
            </Text>
          </View>
        </View>
        {groupIsError && !groupNotFound ? (
          <View
            style={[
              styles.errorBanner,
              { borderColor: palette.borderSubtle, backgroundColor: palette.surfaceElevated },
            ]}
          >
            <Text style={[styles.subtitle, { color: palette.textPrimary }]}>
              {t('groups.detail.loadErrorTitle')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('groups.errorRetryA11y')}
              onPress={onRetryGroup}
              style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
            >
              <Text style={[styles.subtitle, { color: palette.borderFocus }]}>
                {t('groups.retry')}
              </Text>
            </Pressable>
          </View>
        ) : null}
        {groupNotFound ? (
          <View style={{ marginBottom: space.gapMd }}>
            <Text style={[textStyles.body, { color: palette.textPrimary }]}>
              {t('groups.detail.notFoundTitle')}
            </Text>
            <Text
              style={[styles.subtitle, { color: palette.textSecondary, marginTop: space.gapSm }]}
            >
              {t('groups.detail.notFoundBody')}
            </Text>
          </View>
        ) : null}
        {isError ? (
          <View
            style={[
              styles.errorBanner,
              { borderColor: palette.borderSubtle, backgroundColor: palette.surfaceElevated },
            ]}
          >
            <Text style={[styles.subtitle, { color: palette.textPrimary }]}>{rosterErrMsg}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('groups.membersScreen.retryA11y')}
              onPress={onRetry}
              style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
            >
              <Text style={[styles.subtitle, { color: palette.borderFocus }]}>
                {t('groups.retry')}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  }, [
    group,
    groupIsError,
    groupNotFound,
    canAddMembers,
    openAdd,
    palette.iconPrimary,
    groupPending,
    isError,
    rosterError,
    onBack,
    onRetry,
    onRetryGroup,
    palette.borderFocus,
    palette.borderSubtle,
    palette.surfaceElevated,
    palette.surfaceRaised,
    palette.textMuted,
    palette.textPrimary,
    palette.textSecondary,
    roster.length,
    t,
  ]);

  const skeletonBlock = useMemo(() => {
    if (!rosterPending || roster.length > 0) return null;
    return (
      <View style={{ gap: space.gapXs }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.skeletonRow,
              { borderColor: palette.borderSubtle, backgroundColor: palette.surfaceOverlay },
            ]}
          />
        ))}
      </View>
    );
  }, [palette.borderSubtle, palette.surfaceOverlay, roster.length, rosterPending]);

  if (notGroupMember) {
    if (inboxPending) {
      return (
        <SafeAreaView
          edges={['top']}
          style={[styles.safe, { backgroundColor: palette.background }]}
        >
          <View
            style={{ paddingHorizontal: space.screenPadding, paddingTop: space.gapMd, flex: 1 }}
          >
            <View style={styles.topRow}>
              <BackHeaderButton onPress={onBack} accessibilityLabel={t('createGroup.backA11y')} />
              <View style={styles.headerAddPlaceholder} />
            </View>
            <ActivityIndicator
              size="small"
              color={palette.accent}
              style={{ marginTop: space.sectionGap }}
              accessibilityLabel={t('groups.membersScreen.pendingInviteLoadingA11y')}
            />
          </View>
        </SafeAreaView>
      );
    }

    if (pendingInviteForGroup) {
      const inviteTitle = pendingInviteForGroup.name?.trim() || t('invites.unknownGroup');
      const inviteBusy = acceptInviteMutation.isPending || declineInviteMutation.isPending;
      return (
        <SafeAreaView
          edges={['top']}
          style={[styles.safe, { backgroundColor: palette.background }]}
        >
          <View
            style={{
              paddingHorizontal: space.screenPadding,
              paddingTop: space.gapMd,
              flex: 1,
              gap: space.gapMd,
            }}
          >
            <View style={styles.topRow}>
              <BackHeaderButton onPress={onBack} accessibilityLabel={t('createGroup.backA11y')} />
              <View style={styles.headerAddPlaceholder} />
            </View>
            <Text
              style={[textStyles.h3, { color: palette.textPrimary, marginTop: space.gapSm }]}
              accessibilityRole="header"
            >
              {inviteTitle}
            </Text>
            <Text style={[textStyles.body, { color: palette.textSecondary }]}>
              {t('groups.membersScreen.pendingInviteBody')}
            </Text>
            <View style={{ flexDirection: 'row', gap: space.gapMd, marginTop: space.gapMd }}>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('groups.membersScreen.declineInvite')}
                  variant="secondary"
                  onPress={confirmDeclineInviteLeaveScreen}
                  disabled={inviteBusy}
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
                  onPress={runAcceptInvite}
                  disabled={inviteBusy}
                  loading={acceptInviteMutation.isPending}
                  trailing="none"
                  labelCase="none"
                  accessibilityLabel={t('groups.membersScreen.acceptInviteA11y')}
                />
              </View>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
        <View style={{ paddingHorizontal: space.screenPadding, paddingTop: space.gapMd, flex: 1 }}>
          <View style={styles.topRow}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('createGroup.backA11y')} />
            <View style={styles.headerAddPlaceholder} />
          </View>
          <Text
            style={[styles.title, { color: palette.textPrimary, marginTop: space.sectionGap }]}
            accessibilityRole="header"
          >
            {t('groups.membersScreen.notMemberTitle')}
          </Text>
          <Text style={[textStyles.body, { color: palette.textSecondary, marginTop: space.gapMd }]}>
            {t('groups.membersScreen.notMemberBody')}
          </Text>
          <Button
            label={t('groups.membersScreen.notMemberCta')}
            variant="secondary"
            onPress={onBack}
            accessibilityLabel={t('groups.membersScreen.notMemberCtaA11y')}
            style={{ marginTop: space.sectionGap, alignSelf: 'flex-start' }}
            trailing="none"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (groupPending && !group) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.safe, { backgroundColor: palette.background, justifyContent: 'center' }]}
      >
        <View style={{ paddingHorizontal: space.screenPadding }}>
          <BackHeaderButton onPress={onBack} accessibilityLabel={t('createGroup.backA11y')} />
        </View>
        <ActivityIndicator
          size="small"
          color={palette.accent}
          style={{ marginTop: space.sectionGap }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
      <FlatList
        data={groupNotFound || (rosterPending && roster.length === 0) ? [] : roster}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={
          <>
            {listHeader}
            {skeletonBlock}
          </>
        }
        ItemSeparatorComponent={() => (
          <View
            style={[
              styles.hairline,
              {
                backgroundColor: palette.borderSubtle,
                marginLeft: 44 + space.gapMd,
              },
            ]}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: space.screenPadding }]}
        showsVerticalScrollIndicator={false}
      />
      {canAddMembers && !groupNotFound ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('groups.membersScreen.addFabA11y')}
          accessibilityHint={t('groups.membersScreen.addFabHint')}
          onPress={openAdd}
          style={({ pressed }) => [
            styles.fab,
            platformShadow('sm'),
            {
              zIndex: 2,
              elevation: 8,
              right: space.screenPadding,
              bottom: insets.bottom + space.gapLg,
              borderColor: palette.borderSubtle,
              backgroundColor: palette.surfaceFloating,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Ionicons name="person-add-outline" size={24} color={palette.textPrimary} />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

function mapRosterLoadMessage(e: Error | null | undefined, tr: TFunction): string {
  if (!e || !(e instanceof ApiError)) return tr('groups.membersScreen.loadError');
  const key = `groups.membersScreen.loadErrors.${e.code}`;
  const mapped = tr(key);
  if (mapped !== key) return mapped;
  if (e.retryAfter !== undefined && e.retryAfter >= 0) {
    return tr('groups.addMember.errors.retryAfter', { seconds: e.retryAfter });
  }
  return tr('groups.membersScreen.loadError');
}

function mapRemoveMemberErrorMessage(e: ApiError, tr: TFunction): string {
  const code = e.code;
  const key = `groups.membersScreen.removeErrors.${code}`;
  const mapped = tr(key);
  if (mapped !== key) return mapped;
  if (e.retryAfter !== undefined && e.retryAfter >= 0) {
    return tr('groups.addMember.errors.retryAfter', { seconds: e.retryAfter });
  }
  return e.message || tr('groups.membersScreen.removeErrorGeneric');
}

function mapInviteFlowError(e: ApiError, tr: TFunction): string {
  const code = e.code;
  const key = `groups.membersScreen.inviteFlowErrors.${code}`;
  const mapped = tr(key);
  if (mapped !== key) return mapped;
  if (e.retryAfter !== undefined && e.retryAfter >= 0) {
    return tr('groups.addMember.errors.retryAfter', { seconds: e.retryAfter });
  }
  return e.message || tr('groups.membersScreen.inviteFlowErrorGeneric');
}

function mapRoleChangeError(e: ApiError, tr: TFunction): string {
  const code = e.code;
  const key = `groups.membersScreen.roleChangeErrors.${code}`;
  const mapped = tr(key);
  if (mapped !== key) return mapped;
  if (e.retryAfter !== undefined && e.retryAfter >= 0) {
    return tr('groups.addMember.errors.retryAfter', { seconds: e.retryAfter });
  }
  return e.message || tr('groups.membersScreen.roleChangeErrorGeneric');
}
