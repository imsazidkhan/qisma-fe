import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api';
import { BackHeaderButton } from '@/components/ui';
import { GroupDetailScreen } from '@/features/groups/components/GroupDetailScreen';
import { groupDetailRouteStyles as styles } from '@/features/groups/components/groupDetailRoute.styles';
import { useGroupRouteDetail } from '@/features/groups/hooks/useGroupDetail';
import { groupsQueryKeys } from '@/features/groups/queryKeys';
import { isUuid } from '@/features/groups/utils/isUuid';
import { space, textStyles, useThemeColors } from '@/theme';

export type GroupDetailRouteViewProps = {
  groupId: string;
  onBack: () => void;
  /**
   * When `false`, skips `GET …/members` (pending invitees get 403).
   * Open via `/home/group/:id?roster=0` from the invites inbox.
   */
  fetchMembersRoster?: boolean;
};

export function GroupDetailRouteView({
  groupId,
  onBack,
  fetchMembersRoster = true,
}: GroupDetailRouteViewProps): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const queryClient = useQueryClient();
  const routeMode = fetchMembersRoster ? 'memberProfile' : 'invitePreview';
  const { data, isPending, isError, error, refetch } = useGroupRouteDetail(groupId, routeMode);

  useFocusEffect(
    useCallback(() => {
      void refetch();
      if (fetchMembersRoster) {
        void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.balances(groupId) });
      }
    }, [fetchMembersRoster, groupId, queryClient, refetch]),
  );

  const notFound = useMemo(() => {
    if (!isError || !error) return false;
    if (!(error instanceof ApiError)) return false;
    return error.code === 'GROUP_NOT_FOUND' || error.status === 404;
  }, [error, isError]);

  const detailQueryKey =
    routeMode === 'memberProfile'
      ? groupsQueryKeys.memberProfile(groupId)
      : groupsQueryKeys.invitePreview(groupId);

  const onRetry = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: detailQueryKey });
  }, [detailQueryKey, queryClient]);

  const handleAfterGroupRemoved = useCallback(() => {
    void queryClient.removeQueries({ queryKey: groupsQueryKeys.memberProfile(groupId) });
    void queryClient.removeQueries({ queryKey: groupsQueryKeys.invitePreview(groupId) });
    void queryClient.removeQueries({ queryKey: groupsQueryKeys.creatorDetail(groupId) });
    void queryClient.removeQueries({ queryKey: groupsQueryKeys.members(groupId) });
    void queryClient.removeQueries({ queryKey: groupsQueryKeys.groupActivity(groupId) });
    void queryClient.removeQueries({ queryKey: groupsQueryKeys.balances(groupId) });
    void queryClient.invalidateQueries({ queryKey: groupsQueryKeys.myGroups });
    onBack();
  }, [groupId, onBack, queryClient]);

  if (!isUuid(groupId)) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
        <View style={[styles.body, { paddingHorizontal: space.screenPadding }]}>
          <View style={styles.topRow}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('createGroup.backA11y')} />
          </View>
          <Text
            style={[textStyles.h3, { color: palette.textPrimary, marginTop: space.sectionGap }]}
            accessibilityRole="header"
          >
            {t('groups.detail.notFoundTitle')}
          </Text>
          <Text style={[textStyles.body, { color: palette.textSecondary, marginTop: space.gapMd }]}>
            {t('groups.detail.notFoundBody')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isPending && !data) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.centered, { backgroundColor: palette.background }]}
      >
        <View style={styles.topRow}>
          <BackHeaderButton onPress={onBack} accessibilityLabel={t('createGroup.backA11y')} />
        </View>
        <ActivityIndicator size="small" color={palette.accent} />
      </SafeAreaView>
    );
  }

  if (data) {
    return (
      <GroupDetailScreen
        group={data}
        onBack={onBack}
        onAfterRemoved={handleAfterGroupRemoved}
        fetchMembersRoster={fetchMembersRoster}
      />
    );
  }

  if (notFound) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
        <View style={[styles.body, { paddingHorizontal: space.screenPadding }]}>
          <View style={styles.topRow}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('createGroup.backA11y')} />
          </View>
          <Text
            style={[textStyles.h3, { color: palette.textPrimary, marginTop: space.sectionGap }]}
            accessibilityRole="header"
          >
            {t('groups.detail.notFoundTitle')}
          </Text>
          <Text style={[textStyles.body, { color: palette.textSecondary, marginTop: space.gapMd }]}>
            {t('groups.detail.notFoundBody')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
        <View style={[styles.body, { paddingHorizontal: space.screenPadding }]}>
          <View style={styles.topRow}>
            <BackHeaderButton onPress={onBack} accessibilityLabel={t('createGroup.backA11y')} />
          </View>
          <Text
            style={[textStyles.h3, { color: palette.textPrimary, marginTop: space.sectionGap }]}
            accessibilityRole="header"
          >
            {t('groups.detail.loadErrorTitle')}
          </Text>
          <Text style={[textStyles.body, { color: palette.textSecondary, marginTop: space.gapMd }]}>
            {t('groups.detail.loadErrorBody')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('groups.errorRetryA11y')}
            onPress={onRetry}
            style={({ pressed }) => [
              styles.retryBtn,
              { opacity: pressed ? 0.75 : 1, borderColor: palette.border },
            ]}
          >
            <Text style={[textStyles.label, { color: palette.borderFocus }]}>
              {t('groups.retry')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.centered, { backgroundColor: palette.background }]}
    >
      <View style={styles.topRow}>
        <BackHeaderButton onPress={onBack} accessibilityLabel={t('createGroup.backA11y')} />
      </View>
      <ActivityIndicator size="small" color={palette.accent} />
    </SafeAreaView>
  );
}
