import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeaderButton } from '@/components/ui';
import { GroupMembersScreen } from '@/features/groups/components/GroupMembersScreen';
import { groupDetailRouteStyles as styles } from '@/features/groups/components/groupDetailRoute.styles';
import { isUuid } from '@/features/groups/utils/isUuid';
import { space, textStyles, useThemeColors } from '@/theme';

/**
 * Stack route for the group roster: {@link GroupMembersScreen} → `GET /v1/groups/:groupId/members`.
 */
function resolvedParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] ?? '';
  return '';
}

export default function HomeGroupMembersRoute(): ReactElement {
  const { t } = useTranslation();
  const palette = useThemeColors();
  const {
    groupId: rawId,
    userId: rawInviteUserId,
    openAdd: rawOpenAdd,
  } = useLocalSearchParams<{
    groupId: string | string[];
    userId?: string | string[];
    openAdd?: string | string[];
  }>();
  const groupId = resolvedParam(rawId);
  const inviteUserIdParam = resolvedParam(rawInviteUserId);
  const inviteUserId = isUuid(inviteUserIdParam) ? inviteUserIdParam : undefined;
  const openAddParam = resolvedParam(rawOpenAdd);
  const openAddInitially = openAddParam === '1' || openAddParam.toLowerCase() === 'true';

  const deepLinkAddRef = useRef(false);

  useEffect(() => {
    deepLinkAddRef.current = false;
  }, [groupId, inviteUserId, openAddInitially]);

  useEffect(() => {
    if (!isUuid(groupId) || deepLinkAddRef.current) return;
    if (!inviteUserId && !openAddInitially) return;
    deepLinkAddRef.current = true;
    const q = new URLSearchParams();
    if (inviteUserId) q.set('userId', inviteUserId);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    router.replace(`/home/group/${groupId}/add-members${suffix}`);
  }, [groupId, inviteUserId, openAddInitially]);

  const onBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/home');
  }, []);

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

  return <GroupMembersScreen groupId={groupId} onBack={onBack} />;
}
